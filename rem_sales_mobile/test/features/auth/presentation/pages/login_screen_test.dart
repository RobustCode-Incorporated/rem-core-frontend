import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mocktail/mocktail.dart';
import 'package:rem_sales_mobile/features/auth/presentation/pages/auth_bloc.dart';
import 'package:rem_sales_mobile/features/auth/presentation/pages/auth_event.dart';
import 'package:rem_sales_mobile/features/auth/presentation/pages/auth_state.dart';
import 'package:rem_sales_mobile/features/auth/presentation/pages/login_screen_page.dart';

// Création du Mock pour simuler le comportement du AuthBloc
class MockAuthBloc extends Mock implements AuthBloc {}

void main() {
  late MockAuthBloc mockAuthBloc;

  setUpAll(() {
    // Enregistrement d'une valeur par défaut pour les événements d'authentification
    registerFallbackValue(const LoginSubmittedEvent(email: 'test@example.com', password: 'password123'));
  });

  setUp(() {
    mockAuthBloc = MockAuthBloc();
    // Par défaut, l'application est en état non authentifié (écran de login affiché)
    when(() => mockAuthBloc.state).thenReturn(const Unauthenticated());
    when(() => mockAuthBloc.stream).thenAnswer((_) => const Stream.empty());
  });

  testWidgets('🔒 [AUTH UI TEST] L\'écran de connexion valide les champs et émet l\'événement de connexion', (WidgetTester tester) async {
    print('--- 🧪 START: Test de l\'interface d\'authentification (REM Core) ---');

    // 1. Charger l'écran de Login dans le moteur de rendu virtuel de Flutter
    await tester.pumpWidget(
      MaterialApp(
        home: BlocProvider<AuthBloc>.value(
          value: mockAuthBloc,
          child: const LoginScreen(),
        ),
      ),
    );

    // 2. Vérifier que les éléments de l'interface s'affichent correctement
    expect(find.text('REM Enterprise'), findsOneWidget);
    expect(find.text('Adresse Email'), findsOneWidget);
    expect(find.text('Mot de passe'), findsOneWidget);
    print('✅ [UI] Formulaire de connexion affiché avec succès.');

    // 3. Simuler la saisie des identifiants par le commercial
    await tester.enterText(find.byType(TextFormField).at(0), 'vendeur@robust.com'); // Email
    await tester.enterText(find.byType(TextFormField).at(1), 'password123');       // Mot de passe
    await tester.pump();
    print('✅ [UI] Saisie utilisateur simulée ("vendeur@robust.com").');

    // 4. Simuler le clic sur le bouton "SE CONNECTER"
    final buttonFinder = find.byType(ElevatedButton);
    expect(buttonFinder, findsOneWidget);
    await tester.tap(buttonFinder);
    await tester.pump();

    // 5. Vérifier que l'interface a bien envoyé l'événement LoginSubmittedEvent au AuthBloc
    verify(() => mockAuthBloc.add(any(that: isA<LoginSubmittedEvent>()))).called(1);
    print('✅ [UI] Succès : L\'événement de connexion sécurisée a bien été transmis au AuthBloc !');
    print('----------------------------------------------------------------------\n');
  });
}