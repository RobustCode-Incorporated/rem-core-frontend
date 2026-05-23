import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:isar/isar.dart';
import 'package:rem_sales_mobile/features/sales/data/models/local_sales_document.dart';

class SyncManager {
  final Isar isar;
  final http.Client httpClient;
  
  // URL de notre API Backend Node.js / Express (à externaliser plus tard en variable d'env)
  final String baseUrl = 'https://api.robust-management.internal/v1';

  SyncManager({
    required this.isar,
    required this.httpClient,
  });

  /// Tente de synchroniser un document spécifique avec le serveur central
  Future<void> synchronizeDocument(String documentId) async {
    // 1. Récupération du document dans le coffre-fort local Isar
    final localDoc = await isar.localSalesDocuments
        .filter()
        .idEqualTo(documentId)
        .findFirst();

    if (localDoc == null || localDoc.isSynced) {
      return; // Rien à faire si le document n'existe pas ou est déjà synchronisé
    }

    try {
      // 2. Préparation du payload JSON (transformation snake_case pour le backend PostgreSQL)
      final Map<String, dynamic> payload = {
        'id': localDoc.id,
        'type': localDoc.type,
        'number': localDoc.number,
        'status': localDoc.status,
        'total_amount': localDoc.totalAmount,
        'created_at': localDoc.createdAt.toIso8601String(),
      };

      // 3. Expédition de la requête avec clé d'idempotence pour éviter les doublons au backend
      final response = await httpClient.post(
        Uri.parse('$baseUrl/sales/documents'),
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': localDoc.id, // L'UUID local sert de clé d'idempotence
        },
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 10));

      // 4. Validation de la réponse du serveur
      if (response.statusCode == 200 || response.statusCode == 201) {
        // Le serveur a traité et persisté la donnée. On passe au vert localement !
        await isar.writeTxn(() async {
          localDoc.isSynced = true;
          await isar.localSalesDocuments.put(localDoc);
        });
      } else {
        // Le serveur a répondu avec une erreur (ex: 500, 400).
        // On garde le document au chaud en local (isSynced = false) pour un retry ultérieur.
        _logError('Serveur a renvoyé un code ${response.statusCode}');
      }
    } on SocketException catch (e) {
      // Interception de la panne réseau (plus de 4G au marché de Sandaga)
      _logError('Panne réseau détectée, stockage local conservé : ${e.message}');
    } on http.ClientException catch (e) {
      _logError('Erreur client HTTP : ${e.message}');
    } catch (e) {
      // Sécurité générale pour éviter tout crash de l'application
      _logError('Erreur critique lors de la synchronisation : $e');
    }
  }

  void _logError(String message) {
    // Remplacé par un vrai logger (ex: Talker ou Logger package) en production
    print('[SyncManager] ⚠️ $message');
  }
}