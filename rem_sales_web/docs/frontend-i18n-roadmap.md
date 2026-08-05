# Roadmap d’internationalisation frontend (i18n)

## Objectif
Rendre la plateforme multilingue côté frontend en supportant au minimum :
- Français (FR) : langue par défaut
- Anglais (EN)
- Arabe (AR) si vous souhaitez une version plus complète et adaptée au marché

L’objectif est de remplacer progressivement les textes codés en dur par des clés de traduction, tout en gardant une architecture claire et maintenable.

---

## 1. Vision cible

À terme, la plateforme doit permettre :
- de changer de langue depuis l’interface
- de conserver la langue choisie au rechargement de page
- d’afficher les dates, montants et libellés dans la langue sélectionnée
- de garder une expérience cohérente sur toutes les vues

---

## 2. Stack recommandée

Pour une application Vue 3 + Vite, l’option la plus adaptée est :
- vue-i18n

### Pourquoi ce choix
- compatible avec Vue 3
- simple à intégrer dans un projet existant
- bien adapté pour des applications de taille moyenne/grande
- permet la gestion de fichiers JSON par langue

---

## 3. Structure recommandée

```text
src/
  i18n/
    index.js
    locales/
      fr.json
      en.json
      ar.json
```

### Exemple de structure des fichiers
- `src/i18n/index.js` : configuration de vue-i18n
- `src/i18n/locales/fr.json` : traductions françaises
- `src/i18n/locales/en.json` : traductions anglaises
- `src/i18n/locales/ar.json` : traductions arabes

---

## 4. Roadmap phase par phase

### Phase 1 — Fondation technique
Objectif : préparer l’infrastructure i18n.

Étapes :
1. Installer `vue-i18n`
2. Créer le dossier `src/i18n`
3. Configurer l’instance principale de i18n
4. Brancher l’instance dans `main.js`
5. Ajouter un sélecteur de langue dans l’interface (ex. en-tête)

Livrables :
- application capable d’afficher un texte traduit
- changement de langue sans rechargement

---

### Phase 2 — Migration des textes statiques
Objectif : sortir tous les textes visibles de la logique et des composants.

À migrer en priorité :
- boutons
- titres
- messages d’erreur
- libellés de formulaires
- placeholders
- messages de succès/échec
- textes de navigation

Exemple :
```vue
<button>{{ $t('common.logout') }}</button>
```

Recommandation :
- commencer par les vues les plus visibles : login, dashboard, reseller, sales, settings
- garder un système de clés cohérent et lisible

---

### Phase 3 — Formatage localisé
Objectif : adapter les données affichées selon la langue.

À traiter :
- dates
- montants
- nombres
- devises
- pourcentages

Exemple :
```js
new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(amount)
```

Cela évite d’écrire des formats manuellement et rend l’UI plus robuste.

---

### Phase 4 — Persistance et expérience utilisateur
Objectif : rendre le choix de langue fluide.

À mettre en place :
- stockage de la langue dans `localStorage`
- lecture automatique de la langue du navigateur si aucune préférence n’est définie
- possibilité de basculer la langue depuis l’interface
- si besoin, ajout d’un préfixe de langue dans les routes (`/fr`, `/en`, `/ar`)

---

### Phase 5 — Adaptation UX pour les langues RTL
Si vous voulez supporter l’arabe correctement, une étape supplémentaire est nécessaire.

À prévoir :
- ajout de l’attribut `dir` sur le document ou sur la racine de l’application
- adaptation du layout pour les interfaces RTL
- vérification des composants avec marges, alignements et positions

---

### Phase 6 — Qualité et maintenance
Objectif : éviter de perdre en cohérence au fil du temps.

À mettre en place :
- conventions de nommage pour les clés (`common.logout`, `dashboard.title`, etc.)
- fichier central de référence des clés
- revue régulière des traductions manquantes
- tests de rendu simples sur les composants critiques

---

## 5. Recommandation de priorité

### Priorité 1
- configurer l’infrastructure i18n
- mettre en place un premier sélecteur de langue
- traduire les écrans critiques

### Priorité 2
- traduire les composants réutilisables
- gérer les formats de date et de monaie
- persister la langue choisie

### Priorité 3
- support RTL pour l’arabe
- workflows de traduction plus solides
- intégration avec un outil de gestion de traductions si la plateforme grandit

---

## 6. Exemple de structure de clés

```json
{
  "common": {
    "logout": "Déconnexion",
    "save": "Enregistrer",
    "cancel": "Annuler"
  },
  "dashboard": {
    "title": "Tableau de bord"
  },
  "sales": {
    "title": "Ventes",
    "searchPlaceholder": "Rechercher une transaction"
  }
}
```

---

## 7. Recommandation pratique pour ce projet

Pour cette application, je recommanderais de commencer par :
1. traduire les écrans principaux : login, dashboard, ventes, revendeurs, settings
2. remplacer progressivement tous les textes codés en dur dans les composants Vue
3. conserver une seule source de vérité par langue dans des fichiers JSON
4. garder la logique de traduction simple et claire pour ne pas ralentir le développement

---

## 8. Critères de réussite

La mise en place sera considérée comme réussie si :
- l’utilisateur peut changer de langue depuis l’interface
- les textes principaux sont traduits sans rechargement
- les dates et montants s’affichent selon la langue
- la plateforme reste stable et lisible sur plusieurs langues

---

## 9. Prochaine étape recommandée

Je recommande de démarrer par l’implémentation de la Phase 1 et 2 en priorité, avec :
- un sélecteur de langue simple
- une configuration `vue-i18n`
- la traduction des écrans principaux

Si vous voulez, je peux maintenant passer à l’implémentation concrète de cette première étape dans le frontend.
