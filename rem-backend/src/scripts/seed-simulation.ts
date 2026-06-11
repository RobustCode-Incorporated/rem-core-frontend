// Utilisation d'un import compatible ESM/CommonJS pour TypeScript
import { db } from '../config/db';

/**
 * @desc Engineering Simulation Engine - Génération asymétrique de 7 000 documents
 */
export const runDataSimulation = async (companyId: string): Promise<void> => {
  console.log("⚡ [SEED FACTORY] Début du nettoyage et de la restructuration des données transactionnelles...");

  try {
    // Purge complète et ordonnée (Cascading automatique sur les items)
    await db.query('TRUNCATE TABLE public.document_items CASCADE;');
    await db.query('TRUNCATE TABLE public.documents CASCADE;');
    console.log("🧼 [SEED FACTORY] Base nettoyée de ses résidus génériques.");

    // Extraction des deux premiers revendeurs
    const resellersRes = await db.query(
      "SELECT id, name FROM public.resellers WHERE company_id = $1 LIMIT 2;", 
      [companyId]
    );

    if (resellersRes.rows.length < 2) {
      throw new Error("Il te faut au moins 2 revendeurs configurés en base de données.");
    }

    const r1 = resellersRes.rows[0].id;
    const r2 = resellersRes.rows[1].id;

    // Extraction des produits
    const productsRes = await db.query(
      "SELECT id, selling_price FROM public.products WHERE company_id = $1 LIMIT 3;", 
      [companyId]
    );

    if (productsRes.rows.length === 0) {
      throw new Error("Aucun produit trouvé. Ajoute au moins un produit dans public.products.");
    }

    const products = productsRes.rows;
    console.log(`🤖 Profils de simulation initialisés :\n ➔ R1 : ${resellersRes.rows[0].name}\n ➔ R2 : ${resellersRes.rows[1].name}`);

    const totalEntries = 7000;
    await db.query('BEGIN');

    for (let i = 1; i <= totalEntries; i++) {
      const isR1 = Math.random() < 0.70;
      const selectedReseller = isR1 ? r1 : r2;
      
      let status: 'PAID' | 'DRAFT' | 'CANCELLED';
      if (isR1) {
        status = Math.random() < 0.85 ? 'PAID' : (Math.random() < 0.70 ? 'DRAFT' : 'CANCELLED');
      } else {
        status = Math.random() < 0.40 ? 'PAID' : (Math.random() < 0.75 ? 'DRAFT' : 'CANCELLED');
      }

      const docNumber = `FAC-2026-${10000 + i}`;
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const unitPrice = parseFloat(randomProduct.selling_price);
      const totalPrice = unitPrice * quantity;

      const docInsertQuery = `
        INSERT INTO public.documents (company_id, type, number, status, total_amount, reseller_id, created_at, updated_at)
        VALUES ($1, 'FACTURE', $2, $3, $4, $5, NOW() - (random() * INTERVAL '30 days'), NOW())
        RETURNING id;
      `;
      const docRes = await db.query(docInsertQuery, [companyId, docNumber, status, totalPrice, selectedReseller]);
      const insertedDocId = docRes.rows[0].id;

      const itemInsertQuery = `
        INSERT INTO public.document_items (document_id, product_id, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5);
      `;
      await db.query(itemInsertQuery, [insertedDocId, randomProduct.id, quantity, unitPrice, totalPrice]);
    }

    await db.query('COMMIT');
    console.log(`🚀 [SEED SUCCESS] 7 000 transactions asymétriques injectées.`);

  } catch (error) {
    await db.query('ROLLBACK');
    console.error("❌ [SEED CRITICAL ERROR] Échec de la simulation.");
    throw error;
  }
};

// Vérification de l'environnement d'exécution pour le mode CLI (Terminal indépendant)
if (typeof require !== 'undefined' && require.main === module) {
  const defaultCompanyId = '943e411e-9c4c-484f-9dde-9db708f5159a';
  
  runDataSimulation(defaultCompanyId)
    .then(() => {
      console.log("🏁 Fin de la tâche de seeding CLI avec succès.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("💥 Erreur fatale en cours d'exécution CLI :", err);
      process.exit(1);
    });
}