Markdown
# Robust Enterprise Management (REM) — Écosystème Multi-Tenant & Offline-First

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Build](https://img.shields.io/badge/build-passing-success.svg)
![Coverage](https://img.shields.io/badge/coverage-85%25-green.svg)

REM est un écosystème progiciel de gestion (ERP/CRM) moderne, hautement évolutif et sécurisé, conçu spécifiquement pour le secteur du GovTech et la gestion de réseaux de distribution (revendeurs) en Afrique. 

L’infrastructure repose sur une architecture multi-tenant stricte, couplée à une approche hybride : un **Dashboard Web** performant pour les administrateurs/revendeurs et une **Application Mobile Offline-First** pour la résilience sur le terrain.

---

## 📸 Aperçu de l'Interface (UI/UX)

### 1. Authentification Unique (Portal Login)
<img width="1920" height="1080" alt="Screenshot from 2026-05-27 18-06-44" src="https://github.com/user-attachments/assets/358eec61-0367-420d-8748-e4c72eac48a1" />


### 2. Tableau de Bord administrateur (Ajout d'un revendeur )
<img width="1920" height="1080" alt="Screenshot from 2026-05-27 19-18-05" src="https://github.com/user-attachments/assets/7e60f1d4-9337-49a7-8943-c88976dbe9c7" />
 


### 3. Ajout de nouveau articles 
<img width="1920" height="1080" alt="Screenshot from 2026-05-27 19-24-01" src="https://github.com/user-attachments/assets/64f3bed1-d6a6-49cf-b76f-c3dd08397485" />

## 🏗️ Architecture Globale du Système

L'écosystème REM est divisé en trois briques logicielles autonomes mais unifiées par une API RESTful stricte :

┌───────────────────────────────────────────────────────────────────────┐
│                          Robust Core Backend                          │
│          (Node.js • TypeScript • Express • PostgreSQL / Neon)         │
└──────────────────────────────────┬────────────────────────────────────┘
│
┌────────────────┴────────────────┐
▼                                 ▼
┌──────────────────────────────────┐┌──────────────────────────────────┐
│        REM Web Dashboard         ││        REM Mobile Client         │
│     (Vue 3 • Pinia • Axios)      ││   (Offline-First • SQLite Sync)  │
└──────────────────────────────────┘└──────────────────────────────────┘


### Principes Fondamentaux :
* **Multi-Tenancy (Multi-Entreprise)** : Isolation stricte des données au niveau de la base de données via un filtrage systématique par `company_id`. Un jeton corrompu ou incomplet est immédiatement intercepté et bloqué.
* **Intégrité Transactionnelle ACID** : Les opérations sensibles (comme la génération d'une facture et la déduction automatique des stocks) sont encapsulées dans des transactions SQL (`BEGIN`/`COMMIT`/`ROLLBACK`) sécurisées.
* **Synchronisation Mobile (Offline-First)** : L'application mobile capture les transactions localement sans réseau et utilise un modèle de réconciliation au backend via l’endpoint de synchronisation pour pousser les écritures dès le retour de la connectivité.

---

## 🛠️ Stack Technique

### Backend (`rem-core-backend`)
* **Langage & Runtime** : Node.js (v18+), TypeScript (v5.9.3), `ts-node-dev`
* **Framework API** : Express
* **Base de Données** : PostgreSQL (Hébergé sur *Neon Serverless*)
* **Journalisation (Logging)** : Pino + `pino-pretty` (Traçabilité complète des requêtes SQL et cycles de vente)

### Frontend Web (`rem-dashboard-web`)
* **Framework** : Vue 3 (Composition API / `<script setup>`)
* **Gestion d'État (State Management)** : Pinia
* **Client HTTP** : Axios (avec intercepteurs pour l'injection des headers d'autorisation)
* **Visualisation** : Chart.js (pour les dashboards d'analyse financière)

---

## 🗄️ Structure & Schéma de la Base de Données (DDL)

Voici les structures principales implémentées pour garantir la capture CRM complète et le chaînage commercial :

```sql
-- Extension nécessaire pour la génération d'identifiants uniques universels
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des Clients (Capture CRM complète)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des Documents Commerciaux
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'INVOICE' ou 'QUOTE'
    number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT', -- 'DRAFT', 'SENT', 'PAID', 'CANCELLED'
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des Lignes de Vente (Articles liés)
CREATE TABLE IF NOT EXISTS document_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL
);
```
🧪 Tests & Approche TDD (Test-Driven Development)
L’ensemble de la logique financière, du calcul des totaux multi-devises et des déductions de stocks fait l’objet d’une suite de tests automatisés stricts pour interdire toute régression en production.

[ PLACEHOLDER : CAPTURE D'ÉCRAN — TERMINAL EXÉCUTION DES TESTS TDD ]
<img width="1920" height="1080" alt="Screenshot from 2026-05-25 22-27-04" src="https://github.com/user-attachments/assets/3694bd3f-63f2-42b7-ac09-9d834ff3adb3" />

Scénarios clés couverts par les tests :
Isolation Multi-Tenant : Vérification qu'une requête d'un tenant A demandant l'accès aux données d'un tenant B renvoie une erreur 400 / 403.

Atomicité des Ventes : Simulation d'une coupure de courant ou d'un crash base de données au milieu d'une insertion de facture pour s'assurer que le stock produit n'est pas altéré (Scénario de ROLLBACK).

Getters de Réconciliation Pinia : Validation de la fonction totalsByCurrency du store de vente pour s'assurer du tri mathématique correct des montants cumulés selon la devise (XOF, USD, etc.) et le statut (PAID, DRAFT).

## Installation & Lancement en Mode Développement
```
Prérequis
Node.js (Version LTS recommandée)

Une instance PostgreSQL active (ou une chaîne de connexion Neon)

1. Configuration du Backend
Naviguez dans le dossier backend :

Bash
cd rem-backend
Installez les dépendances :

Bash
npm install
Créez un fichier .env à la racine et configurez vos variables :

Code snippet
PORT=3000
DATABASE_URL=postgres://votre_utilisateur:mot_de_passe@neon-cluster.postgres.neon.tech/rem_db?sslmode=verify-full
JWT_SECRET=votre_cle_secrete_ultra_securisee
Lancez le serveur de développement :

Bash
npm run dev
2. Configuration du Frontend Web
Naviguez dans le dossier frontend :

Bash
cd rem-frontend
Installez les dépendances :

Bash
npm install
Créez un fichier .env à la racine et liez-le à votre API Core :

Code snippet
VITE_API_BASE_URL=[https://votre-url-api.github.dev/api](https://votre-url-api.github.dev/api)
Démarrez l'application :

Bash
npm run dev
🛰️ Spécifications des Endpoints API Principaux
Gestion des Clients (/api/sales/clients)
POST / : Crée ou associe un client complet.

Payload attendu : { name, phone, email, address, company_id }

Pièces Commerciales & POS (/api/sales/documents)
POST / : Valide une vente directe. Génère un numéro chronologique sécurisé (ex: FACT-354921), écrit les lignes de factures à la volée et applique la mise à jour des stocks en cas de statut PAID.

GET / : Récupère la liste historique filtrée pour le multi-tenant via le paramètre de requête ?company_id=....

Synchronisation Offline Mobile (/api/sales/sync)
POST / : Reçoit un tableau de documents créés localement par l'application mobile et réconcilie de façon asynchrone les états du stock central.

🔒 Sécurité et Mises en Garde Évolutives (SSL/PG v9)
L'écosystème REM intègre les alertes de sécurité d'infrastructure modernes. Pour anticiper les futures normes des paquets pg et pg-connection-string, l'écosystème recommande :

L'utilisation explicite de sslmode=verify-full pour toutes les connexions distantes de production vers Neon PostgreSQL afin de maintenir la résilience des canaux de transport de données chiffrés.
