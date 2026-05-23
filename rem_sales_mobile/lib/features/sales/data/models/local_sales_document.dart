import 'package:isar/isar.dart';
import 'sales_document_model.dart';

part 'local_sales_document.g.dart'; // Ce fichier sera généré automatiquement par Isar

@Collection()
class LocalSalesDocument {
  // Isar nécessite un Id auto-incrémenté de type int pour sa clé primaire interne
  Id idInternal = Isar.autoIncrement;

  // UUID textuel synchronisé avec PostgreSQL (indexé pour des requêtes rapides)
  @Index(unique: true)
  late String id;

  late String type;
  late String number;
  late String status;
  late double totalAmount;
  late DateTime createdAt;

  // 🚀 LA CLÉ DU OFFLINE-FIRST : Flag pour identifier ce qui doit être poussé au backend
  late bool isSynced;

  /// Convertit un modèle Isar local en entité métier exploitable par l'UI
  SalesDocument toSalesDocument() {
    return SalesDocument(
      id: id,
      type: type,
      number: number,
      status: status,
      totalAmount: totalAmount,
      createdAt: createdAt,
    );
  }

  /// Factory pour transformer un SalesDocument distant en structure Isar locale
  static LocalSalesDocument fromSalesDocument(SalesDocument doc, {bool synced = true}) {
    return LocalSalesDocument()
      ..id = doc.id
      ..type = doc.type
      ..number = doc.number
      ..status = doc.status
      ..totalAmount = doc.totalAmount
      ..createdAt = doc.createdAt
      ..isSynced = synced;
  }
}