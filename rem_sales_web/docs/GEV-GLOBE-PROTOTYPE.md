# Prototype : globe GEV minimal (Option B) + recherche logistique

Porté depuis le prototype d'origine, développé et vérifié sur
`RobustCode-Incorporated/Robust-Enterprise-Management` (branche
`prototype/gev-globe-map`). Ce document reprend l'essentiel côté frontend ;
le contexte complet (analyse du système de carte REM, options d'intégration)
vit dans `Resume by One.md` du dépôt `gods-eye-view`.

## Ce qui a été ajouté

- [src/components/GevGlobeMap.vue](../src/components/GevGlobeMap.vue) : un
  globe Cesium minimal construit avec `gods-eye-view/application`
  (`createApplication`), en n'utilisant que :
  - `createApplicationViewer` (`gods-eye-view/application/viewer`) — viewer
    Cesium nu ;
  - `createEsriImagery` (`gods-eye-view/maps/imagery`) — imagerie de base
    gratuite, sans clé Cesium ion ;
  - `initAnnotations` (`gods-eye-view/annotations`) — un pin par revendeur ;
  - `createDefaultPlaceSearch` (`gods-eye-view/search`) — recherche
    d'adresse (Photon, keyless) + calcul d'itinéraire.
  - `createControls` et `createData` sont des no-op : aucune couche métier
    de GEV (avions/navires/CCTV/etc.) n'est réutilisée.
- [src/views/GlobePrototype.vue](../src/views/GlobePrototype.vue) + route
  `/globe-prototype` dans [src/router/index.js](../src/router/index.js),
  ajoutés sans toucher aux routes existantes.
- Dépendances : `gods-eye-view` (github:bilawalsidhu/gods-eye-view),
  `cesium`, et en devDependency `vite-plugin-cesium` (branché dans
  `vite.config.js`).

## Les 3 outils du prototype

- **🔎 Rechercher une adresse** — géocode une adresse (Photon/OSM, keyless)
  et recentre la caméra dessus.
- **🚚 Itinéraire logistique** — trajet réel (distance + durée) entre deux
  revendeurs existants.
- **🗺️ Trajet entre deux adresses** — même calcul, mais à partir de deux
  adresses tapées au clavier (ex: une nouvelle adresse de livraison), chacune
  géocodée avant de calculer l'itinéraire.

Le routage dégrade honnêtement vers une ligne droite étiquetée "itinéraire
indisponible" si le calcul échoue — comportement natif de `gods-eye-view`.

## Dépendance backend

Le calcul d'itinéraire appelle `GET {VITE_API_URL}/route`, qui doit exister
côté backend. Ce endpoint est un proxy vers un serveur OSRM (public par
défaut — voir la variable `OSRM_URL`), porté séparément sur
`RobustCode-Incorporated/rem-core-backend`, branche
`prototype/gev-logistics-route` (`rem-backend/src/controllers/route.controller.ts`
+ `rem-backend/src/routes/route.routes.ts`). Sans ce endpoint côté backend,
la recherche d'adresse fonctionne (Photon est appelé directement depuis le
navigateur), mais le calcul d'itinéraire échoue et bascule sur la ligne
droite de secours.

## Comment tester en local

```bash
cd rem_sales_web
npm install
npm run dev
```

`VITE_API_URL` (fichier `.env`) pointe par défaut sur le backend de
production (`https://rem-core-backend.onrender.com/api`). Pour tester contre
un backend local (avec la branche `prototype/gev-logistics-route`), créer un
`.env.local` (non commité) :

```
VITE_API_URL=http://localhost:3000/api
```

Ouvrir `/globe-prototype` après connexion (le composant a besoin du `token`
et du `companyId` en `localStorage`, comme `ResellersMap.vue`).

## Ce qui n'a pas été fait (hors périmètre du prototype)

- Pas de remplacement de `ResellersMap.vue` (Leaflet) — les deux cartes
  coexistent.
- Pas de mode heatmap côté globe.
- Popup analytics (donut + top produits) non porté sur le globe.
- Pas d'itinéraire multi-arrêts (GEV supporte déjà des waypoints multiples
  côté moteur — extension naturelle, pas un nouveau concept).
