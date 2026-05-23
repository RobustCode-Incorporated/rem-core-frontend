import 'package:equatable/equatable.dart';
import 'package:rem_sales_mobile/features/sales/data/models/sales_document_model.dart';

abstract class SalesEvent extends Equatable {
  const SalesEvent();

  @override
  List<Object?> get props => [];
}

class SaveDocumentEvent extends SalesEvent {
  final SalesDocument document;

  const SaveDocumentEvent(this.document);

  @override
  List<Object?> get props => [document];
}