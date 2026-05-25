import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

// 1. Événement déclenché au démarrage de l'application pour voir si un token existe déjà
class AppStartedEvent extends AuthEvent {}

// 2. Événement déclenché lorsque l'utilisateur clique sur "SE CONNECTER"
class LoginSubmittedEvent extends AuthEvent {
  final String email;
  final String password;

  const LoginSubmittedEvent({required this.email, required this.password});

  @override
  List<Object?> get props => [email, password];
}

// 3. Événement de déconnexion
class LogoutRequestedEvent extends AuthEvent {}