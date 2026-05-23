import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rem_sales_mobile/features/sales/data/repositories/sales_repository.dart';
import 'sales_event.dart';
import 'sales_state.dart';

class SalesBloc extends Bloc<SalesEvent, SalesState> {
  final SalesRepository salesRepository;

  SalesBloc({required this.salesRepository}) : super(SalesInitial()) {
    // On associe l'événement à sa fonction de traitement
    on<SaveDocumentEvent>(_onSaveDocument);
  }

  Future<void> _onSaveDocument(SaveDocumentEvent event, Emitter<SalesState> emit) async {
    emit(SalesLoading());
    try {
      // Appel à notre repository qui gère la persistence Isar ++ la synchro réseau
      await salesRepository.saveSalesDocument(event.document);
      emit(SalesSuccess());
    } catch (e) {
      emit(SalesError(e.toString()));
    }
  }
}