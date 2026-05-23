import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:isar/isar.dart';
import 'package:rem_sales_mobile/features/sales/data/models/local_sales_document.dart';

// Import du futur gestionnaire (qui va faire planter la compilation au début)
import 'package:rem_sales_mobile/features/sales/data/datasources/sync_manager.dart';

void main() {
  late Isar isar;
  late Directory tempDir;

  setUpAll(() async {
    await Isar.initializeIsarCore(download: true);
    tempDir = await Directory.systemTemp.createTemp('sync_test_dir');
  });

  setUp(() async {
    isar = await Isar.open([LocalSalesDocumentSchema], directory: tempDir.path);
  });

  tearDown(() async {
    await isar.close(deleteFromDisk: true);
  });

  test('🔴 TDD: Devrait retenir le document en local si le réseau plante, puis le synchroniser au retour du réseau', () async {
    // 1. On prépare le document en base locale
    final localDoc = LocalSalesDocument()
      ..id = 'sync-uuid-999'
      ..type = 'INVOICE'
      ..number = 'FACT-OFFLINE-999'
      ..status = 'DRAFT'
      ..totalAmount = 45000.0
      ..createdAt = DateTime.now()
      ..isSynced = false;

    await isar.writeTxn(() async => await isar.localSalesDocuments.put(localDoc));

    // 2. MOCK RESEAU EN PANNE : Le client HTTP lève une exception réseau
    final failingClient = MockClient((request) async {
      throw const SocketException('Pas de connexion internet Internet (Marché de Sandaga)');
    });

    final syncManager = SyncManager(isar: isar, httpClient: failingClient);

    // Act & Assert 1 : Tentative de synchro qui échoue mais ne crash pas l'app
    await syncManager.synchronizeDocument(localDoc.id);
    
    final docAfterFailure = await isar.localSalesDocuments.filter().idEqualTo('sync-uuid-999').findFirst();
    expect(docAfterFailure!.isSynced, isFalse); // Toujours au coffre-fort local !

    // 3. MOCK RESEAU DE RETOUR : Le client HTTP répond 201 Created
    final successClient = MockClient((request) async {
      return http.Response('{"status": "success"}', 201);
    });

    final healthySyncManager = SyncManager(isar: isar, httpClient: successClient);

    // Act 2 : Le réseau revient, on force la vidange de la file d'attente
    await healthySyncManager.synchronizeDocument(localDoc.id);

    // Assert 2 : Le document doit être marqué comme synchronisé !
    final docAfterSuccess = await isar.localSalesDocuments.filter().idEqualTo('sync-uuid-999').findFirst();
    expect(docAfterSuccess!.isSynced, isTrue);
  });
}