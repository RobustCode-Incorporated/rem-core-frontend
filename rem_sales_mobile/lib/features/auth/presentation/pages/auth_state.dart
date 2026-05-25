import 'package:equatable/equatable.dart';

abstract class AuthState extends Equatable {
  const AuthState();
  
  @override
  List<Object?> get props => [];
}

// L'application vérifie si un token est en mémoire
class AuthInitial extends AuthState {}

// En cours de communication avec le serveur backend
class AuthLoading extends AuthState {}

// Authentification réussie : on stocke le token et les infos de l'utilisateur
class Authenticated extends AuthState {
  final String token;
  // Tu pourras ajouter plus tard : final String companyId;

  const Authenticated({required this.token});

  @override
  List<Object?> get props => [token];
}

// Non connecté ou erreur de login
class Unauthenticated extends AuthState {
  final String? errorMessage;

  const Unauthenticated({this.errorMessage});

  @override
  List<Object?> get props => [errorMessage];
}