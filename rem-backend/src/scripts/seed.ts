import { db } from '../config/db';
import pino from 'pino';

const logger = pino({ transport: { target: 'pino-pretty' } });

async function runSeeder() {
  // 🎯 Configuration multi-tenant : ID de l'entreprise cible
  const companyId = '943e411e-9c4c-484f-9dde-9db708f5159a';
  
  // 🔒 Hash bcrypt correspondant au mot de passe générique : "Password123!"
  const mockPasswordHash = '$2b$10$e0M2V.68tT8H68kH.u9vO.Z19aVv1.u167B6.yG87aG.fE8H1hP1G';

  logger.info('[REM SEEDER] Début du repuplement synchronisé (Users + Resellers)...');

  try {
    await db.query('BEGIN');

    // ==========================================
    // 1. INJECTION DES CLIENTS B2B
    // ==========================================
    logger.info('[REM SEEDER] Injection des clients...');
    const clientQuery = `
      INSERT INTO clients (company_id, name, email, phone, address, created_at)
      VALUES 
        ($1, 'Alimentation du Centre', 'contact@alicentre.com', '+243810000001', '12 Avenue de la Justice, Kinshasa', NOW()),
        ($1, 'Supermarché Kin-Mart', 'info@kinmart.cd', '+243890000002', '30 Boulevard du 30 Juin, Kinshasa', NOW()),
        ($1, 'Établissements Mwamba & Fils', 'mwamba@gmail.com', '+243820000003', '45 Avenue Kenda, Lubumbashi', NOW())
      RETURNING id;
    `;
    const clientRes = await db.query(clientQuery, [companyId]);
    const clientIds = clientRes.rows.map(r => r.id);

    // ==========================================
    // 2. INJECTION DU CATALOGUE PRODUITS
    // ==========================================
    logger.info('[REM SEEDER] Injection des produits...');
    const productQuery = `
      INSERT INTO products (company_id, name, purchase_price, selling_price, stock_quantity, min_stock_alert, currency, created_at)
      VALUES 
        ($1, 'Farine de Froment Super 25kg', 18.50, 24.00, 150, 20, 'USD', NOW()),
        ($1, 'Huile de Palme Raffinée 5L', 6.20, 9.50, 85, 15, 'USD', NOW()),
        ($1, 'Sucre de Canne Sac 50kg', 32.00, 41.50, 40, 10, 'USD', NOW()),
        ($1, 'Lait en Poudre Premium 1kg', 7.10, 11.20, 200, 30, 'USD', NOW())
      RETURNING id, selling_price;
    `;
    const productRes = await db.query(productQuery, [companyId]);
    const products = productRes.rows;

    // ==========================================
    // 3. DOUBLE INJECTION : USERS + REVENDEURS
    // ==========================================
    logger.info('[REM SEEDER] Injection croisée dans "users" et "resellers"...');

    const rawResellersData = [
      { first: 'Christian', last: 'Mulumba', email: 'christian.m@rem-reseller.com', depot: 'Dépôt Gombe Hub', lat: -4.3013, lng: 15.3048 },
      { first: 'Sarah', last: 'Mwansa', email: 'sarah.m@rem-reseller.com', depot: 'Dépôt Victoire', lat: -4.3382, lng: 15.3151 },
      { first: 'Idris', last: 'Kabongo', email: 'idris.k@rem-reseller.com', depot: 'Dépôt Limete Industrial', lat: -4.3596, lng: 15.3614 }
    ];

    const resellerIds: string[] = [];

    for (const r of rawResellersData) {
      // A. Insertion dans la table centrale 'users' avec le rôle 'RESELLER'
      const userInsertQuery = `
        INSERT INTO public.users (company_id, first_name, last_name, email, password_hash, role, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, 'STAFF', true, NOW())
        RETURNING id;
      `;
      const userRes = await db.query(userInsertQuery, [companyId, r.first, r.last, r.email, mockPasswordHash]);
      const newUserId = userRes.rows[0].id;

      // B. Insertion dans la table métier 'resellers' liée par l'ID ou les infos
      const resellerInsertQuery = `
        INSERT INTO public.resellers (id, company_id, name, email, password_hash, phone, deposit_name, latitude, longitude, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id;
      `;
      const fullName = `${r.first} ${r.last}`;
      const resellerRes = await db.query(resellerInsertQuery, [
        newUserId, // Partage de l'UUID pour un alignement d'index parfait
        companyId, 
        fullName, 
        r.email, 
        mockPasswordHash, 
        '+243814444001', 
        r.depot, 
        r.lat, 
        r.lng
      ]);
      
      resellerIds.push(resellerRes.rows[0].id);
    }

    // ==========================================
    // 4. INJECTION DES DOCUMENTS COMMERCIAUX
    // ==========================================
    logger.info("[REM SEEDER] Génération de l'historique des ventes...");
    
    const doc1 = await db.query(`
      INSERT INTO public.documents (company_id, client_id, reseller_id, type, number, status, total_amount, created_at)
      VALUES ($1, $2, $3, 'FACTURE', 'FACT-260001', 'PAID', 161.50, NOW() - INTERVAL '2 days') RETURNING id;
    `, [companyId, clientIds[0], resellerIds[0]]);

    const doc2 = await db.query(`
      INSERT INTO public.documents (company_id, client_id, reseller_id, type, number, status, total_amount, created_at)
      VALUES ($1, $2, $3, 'FACTURE', 'FACT-260002', 'SENT', 83.00, NOW() - INTERVAL '1 day') RETURNING id;
    `, [companyId, clientIds[1], resellerIds[1]]);

    // ==========================================
    // 5. INJECTION DES ARTICLES DE DOCUMENTS
    // ==========================================
    logger.info('[REM SEEDER] Liaison des articles aux documents...');
    
    await db.query(`
      INSERT INTO public.document_items (document_id, product_id, quantity, unit_price, total_price)
      VALUES 
        ($1, $2, 5, $3, 120.00), 
        ($1, $4, 5, $5, 41.50);
    `, [doc1.rows[0].id, products[0].id, products[0].selling_price, products[2].id, products[2].selling_price]);

    await db.query(`
      INSERT INTO public.document_items (document_id, product_id, quantity, unit_price, total_price)
      VALUES 
        ($1, $2, 2, $3, 19.00), 
        ($1, $4, 4, $5, 64.00);
    `, [doc2.rows[0].id, products[1].id, products[1].selling_price, products[0].id, products[0].selling_price]);

    await db.query('COMMIT');
    logger.info('🎯 [REM SEEDER SUCCESS] Base de données et accès utilisateurs repuplés avec succès !');

  } catch (error) {
    await db.query('ROLLBACK');
    logger.error(error, '❌ [REM SEEDER CRITICAL ERROR] Échec du seeding, rollback appliqué.');
  } finally {
    process.exit(0);
  }
}

runSeeder();