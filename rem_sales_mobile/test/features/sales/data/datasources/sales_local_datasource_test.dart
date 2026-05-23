import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:isar/isar.dart';

// Import de ton modèle généré avec succès
import 'package:rem_sales_mobile/features/sales/data/models/local_sales_document.dart';

void main() {
  late Isar isar;
  late Directory tempDir;

  setUpAll(() async {
    // Initialisation des binaires Isar Core pour l'exécution hors-appareil
    await Isar.initializeIsarCore(download: true);
    
    // Création d'un répertoire temporaire propre au cycle de test
    tempDir = await Directory.systemTemp.createTemp('isar_test_dir');
  });

  setUp(() async {
    // On ouvre Isar directement dans notre dossier temporaire Dart standard
    isar = await Isar.open(
      [LocalSalesDocumentSchema],
      directory: tempDir.path,
    );
  });

  tearDown(() async {
    // Nettoyage après chaque test
    await isar.close(deleteFromDisk: true);
  });

  test('✅ TDD: Devrait persister un SalesDocument localement et le récupérer', () async {
    final mockDocument = LocalSalesDocument()
      ..id = 'doc-uuid-123'
      ..type = 'INVOICE'
      ..number = 'FACT-OFFLINE-001'
      ..status = 'DRAFT'
      ..totalAmount = 75000.0
      ..createdAt = DateTime.now()
      ..isSynced = false; // Flag crucial pour le futur SyncManager

    // Act: Écriture dans le storage Isar local
    await isar.writeTxn(() async {
      await isar.localSalesDocuments.put(mockDocument);
    });

    // Assert: Récupération et vérification de la persistence
    final savedDoc = await isar.localSalesDocuments.filter().idEqualTo('doc-uuid-123').findFirst();

    expect(savedDoc, isNotNull);
    expect(savedDoc!.number, 'FACT-OFFLINE-001');
    expect(savedDoc.isSynced, isFalse);
  });
}