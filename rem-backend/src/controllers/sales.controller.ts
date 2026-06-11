import { Request, Response } from 'express';
import { db } from '../config/db';
import pino from 'pino';

const logger = pino({ transport: { target: 'pino-pretty' } });

/**
 * Logique de décrémentation intelligente (Hub-and-Spoke)
 */
const updateInventory = async (client: any, productId: string, quantity: number, user: any, companyId: string) => {
  if (user.role === 'STAFF') {
    // Décrémentation du stock revendeur
    await client.query(
      `UPDATE public.reseller_stocks 
       SET quantity = quantity - $1 
       WHERE reseller_id = $2 AND product_id = $3`,
      [quantity, user.id, productId]
    );
  } else {
    // Décrémentation du stock central Admin
    await client.query(
      `UPDATE public.products 
       SET stock_quantity = stock_quantity - $1 
       WHERE id = $2 AND company_id = $3`,
      [quantity, productId, companyId]
    );
  }
};

// ==========================================
// 1. CRÉATION DE DOCUMENTS COMMERCIAUX (Strictement au selling_price)
// ==========================================
export const createSalesDocument = async (req: Request, res: Response): Promise<void> => {
  const { clientId, type, items, status, company_id } = req.body;
  const user = (req as any).user; 
  const companyId = company_id || user?.companyId;

  // Log de départ pour vérifier ce que le front envoie au serveur
  logger.info({ type, companyId, userId: user?.id }, `[REM SALES] Début de création de document. Nombre d'articles: ${items?.length}`);

  try {
    await db.query('BEGIN');

    let totalAmount = 0;
    const computedItems = [];

    for (const item of items) {
      // Récupération de l'ID peu importe le format (camelCase ou snake_case)
      const pid = item.product_id || item.productId;

      if (!pid) {
        logger.error(item, "[REM PRICING ERROR] Un article ne possède pas d'ID de produit valide");
        throw new Error("ID de produit manquant dans la requête");
      }

      // Requête stricte sur la colonne selling_price
      const prodRes = await db.query(
        'SELECT id, selling_price, name FROM public.products WHERE id = $1 AND company_id = $2',
        [pid, companyId]
      );

      let unitPrice = 0;

      if (prodRes.rows.length > 0) {
        const dbProduct = prodRes.rows[0];
        // On force la conversion en nombre au cas où le type SQL soit un string/numeric
        unitPrice = Number(dbProduct.selling_price);
        
        logger.info(`[REM PRICING MATCH] Produit trouvé : "${dbProduct.name}" (${pid}). Application du selling_price BDD : ${unitPrice} $`);
      } else {
        // Si la ligne du dessus ne renvoie rien, le serveur prenait la valeur du front (qui est le prix d'achat)
        const frontPrice = item.unit_price || item.unitPrice || 0;
        
        logger.warn(
          `[REM PRICING WARNING] Produit ${pid} INTROUVABLE en BDD pour l'entreprise ${companyId}. ` +
          `Le serveur est obligé de prendre le prix du front : ${frontPrice} $ (Vérifie l'ID du produit ou l'ID de l'entreprise)`
        );
        
        unitPrice = Number(frontPrice);
      }

      const quantity = item.quantity || 1;
      const lineTotal = quantity * unitPrice;
      totalAmount += lineTotal;

      computedItems.push({
        productId: pid,
        quantity,
        unitPrice,
        lineTotal
      });
    }

    // Génération du numéro de document
    const prefix = type === 'QUOTE' ? 'DEVIS' : type === 'RESTOCK_REQUEST' ? 'RESTOCK' : 'FACT';
    const docNumber = `${prefix}-${Date.now().toString().slice(-6)}`;

    const docQuery = `
      INSERT INTO documents (company_id, client_id, type, number, status, total_amount, reseller_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;
    
    const finalResellerId = user?.role === 'STAFF' ? user.id : (req.body.reseller_id || null);

    const docRes = await db.query(docQuery, [companyId, clientId || null, type, docNumber, status, totalAmount, finalResellerId]);
    const docId = docRes.rows[0].id;

    // Insertion des lignes d'articles basées sur le selling_price validé
    for (const item of computedItems) {
      await db.query(
        'INSERT INTO document_items (document_id, product_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)',
        [docId, item.productId, item.quantity, item.unitPrice, item.lineTotal]
      );

      if (status === 'PAID' && item.productId) {
        await updateInventory(db, item.productId, item.quantity, user, companyId);
      }
    }

    await db.query('COMMIT');
    logger.info({ docId, docNumber, totalAmount }, "[REM SALES SUCCESS] Document créé avec succès au selling_price");
    
    res.status(201).json({ message: 'Document enregistré avec succès', documentId: docId, totalAmount });
  } catch (error: any) {
    await db.query('ROLLBACK');
    logger.error(error, '[REM SALES ERROR] Échec de la transaction');
    res.status(500).json({ error: 'Erreur lors du calcul ou de la transaction.', details: error.message });
  }
};

// ==========================================
// 2. CRÉATION DE CLIENTS - AVEC ADRESSE
// ==========================================
export const createClient = async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, address, company_id } = req.body;
  const companyId = company_id || (req as any).user?.companyId;

  logger.info({ companyId, name, email }, '[REM CLIENTS] Tentative de création de client avec données complètes');

  if (!name || name.trim() === '') {
    res.status(400).json({ error: 'Le nom du client est obligatoire.' });
    return;
  }

  if (!companyId || companyId === 'bf30cd12-9c1d-4074-b4a0-000000000000') {
     res.status(400).json({ error: 'ID entreprise manquant ou invalide.' });
     return;
  }

  try {
    const clientQuery = `
      INSERT INTO clients (company_id, name, email, phone, address, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, company_id, name, email, phone, address, created_at;
    `;
    
    const clientValues = [companyId, name, email || null, phone || null, address || null];
    const result = await db.query(clientQuery, clientValues);
    const newClient = result.rows[0];

    logger.info({ clientId: newClient.id, name: newClient.name }, '[REM CLIENTS SUCCESS] Profil complet du client créé en base.');

    res.status(201).json({
      message: 'Client créé avec succès',
      client: newClient
    });
  } catch (error: any) {
    logger.error(error, '[REM CLIENTS ERROR] Échec de la création du client');
    
    if (error.code === '23505') {
       res.status(409).json({ error: 'Un client avec cet identifiant ou email existe déjà.' });
       return;
    }

    res.status(500).json({ error: 'Erreur fatale lors de la création du client.' });
  }
};

// ==========================================
// 3. ENCAISSEMENT ET MISE À JOUR DU STATUT (ADMIN / CENTRAL)
// ==========================================
export const updateDocumentStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status: newStatus, company_id } = req.body; 
  
  // 🛠️ FALLBACK SÉCURISÉ : Récupère l'ID du token OU du body OU de la query string
  const companyId = (req as any).user?.companyId || company_id || req.query.company_id || req.query.companyId;

  logger.info({ documentId: id, newStatus, companyId }, "[REM SALES] Demande de changement de statut par l'administration");

  const allowedStatuses = ['PAID', 'CANCELLED'];
  if (!allowedStatuses.includes(newStatus)) {
     res.status(400).json({ error: "Statut invalide. Choisissez uniquement parmi : PAID, CANCELLED" });
     return;
  }

  if (!companyId) {
    res.status(400).json({ error: "L'identifiant de l'entreprise (company_id) est introuvable." });
    return;
  }

  try {
    await db.query('BEGIN');

    // 1. Récupération de l'état actuel du document en base
    const docQuery = `
      SELECT status, reseller_id FROM documents WHERE id = $1 AND company_id = $2
    `;
    const docRes = await db.query(docQuery, [id, companyId]);

    if (docRes.rows.length === 0) {
      await db.query('ROLLBACK');
      res.status(404).json({ error: 'Document introuvable ou non autorisé pour cette entreprise.' });
      return;
    }

    const { status: oldStatus, reseller_id: resellerId } = docRes.rows[0];

    // Sécurité : Éviter de refaire la même opération si le statut est déjà identique
    if (oldStatus === newStatus) {
      await db.query('ROLLBACK');
      res.status(400).json({ error: `Le document possède déjà le statut : ${newStatus}.` });
      return;
    }

    // 2. Extraction des articles reliés au document pour la mise à jour des stocks
    const itemsQuery = `SELECT product_id, quantity FROM document_items WHERE document_id = $1`;
    const itemsRes = await db.query(itemsQuery, [id]);

    // ==========================================
    // LOGIQUE DE TRAITEMENT DES STOCKS
    // ==========================================

    // CAS A : Encaisser un brouillon (DRAFT -> PAID) ➔ On diminue les stocks
    if (oldStatus === 'DRAFT' && newStatus === 'PAID') {
      for (const item of itemsRes.rows) {
        if (!item.product_id) continue;
        if (resellerId) {
          // Si la commande appartient à un revendeur, on décrémente son stock magasin
          await db.query(
            `UPDATE public.reseller_stocks SET quantity = quantity - $1 WHERE reseller_id = $2 AND product_id = $3`,
            [item.quantity, resellerId, item.product_id]
          );
        } else {
          // Sinon, on décrémente le stock central de l'entreprise
          await db.query(
            `UPDATE public.products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND company_id = $3`,
            [item.quantity, item.product_id, companyId]
          );
        }
      }
      logger.info(`[REM STOCK] Stocks décrémentés avec succès (DRAFT -> PAID) pour le document ${id}`);
    }

    // CAS B : Annuler une facture déjà payée (PAID -> CANCELLED) ➔ On recrédite les stocks !
    else if (oldStatus === 'PAID' && newStatus === 'CANCELLED') {
      for (const item of itemsRes.rows) {
        if (!item.product_id) continue;
        if (resellerId) {
          await db.query(
            `UPDATE public.reseller_stocks SET quantity = quantity + $1 WHERE reseller_id = $2 AND product_id = $3`,
            [item.quantity, resellerId, item.product_id]
          );
        } else {
          await db.query(
            `UPDATE public.products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND company_id = $3`,
            [item.quantity, item.product_id, companyId]
          );
        }
      }
      logger.warn(`[REM STOCK RESTORATION] Facture payée annulée. Marchandises remises en stock pour le document ${id}`);
    }

    // CAS C : Annuler un brouillon (DRAFT -> CANCELLED) ➔ Rien à faire sur les stocks
    else if (oldStatus === 'DRAFT' && newStatus === 'CANCELLED') {
      logger.info(`[REM STOCK] Aucun impact sur le stock (DRAFT -> CANCELLED) pour le document ${id}`);
    }

    // 3. Mise à jour finale du document
    const updateQuery = `
      UPDATE documents 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 AND company_id = $3
      RETURNING id, number, status, total_amount, updated_at;
    `;
    const updateRes = await db.query(updateQuery, [newStatus, id, companyId]);

    await db.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: `Le document a bien été mis à jour vers le statut : ${newStatus}`,
      document: updateRes.rows[0]
    });

  } catch (error) {
    await db.query('ROLLBACK');
    logger.error(error, "[REM SALES ERROR] Échec lors du changement de statut admin");
    res.status(500).json({ error: 'Erreur fatale lors de la modification et de la régulation des stocks.' });
  }
};

// ==========================================
// 4. SYNCHRONISATION OFFLINE-FIRST (MOBILE)
// ==========================================
export const syncOfflineDocument = async (req: Request, res: Response): Promise<void> => {
  const { id, type, number, status, totalAmount, items } = req.body;
  const companyId = (req as any).user?.companyId;

  logger.info({ companyId, documentId: id, number }, '[REM SALES SYNC] Réception d\'un document et de ses articles');

  if (!id || !type || !number || !status || totalAmount === undefined || !items || !Array.isArray(items)) {
    res.status(400).json({ error: 'Champs de synchronisation ou tableau d\'articles obligatoires manquants.' });
    return;
  }

  try {
    await db.query('BEGIN');

    const syncDocQuery = `
      INSERT INTO documents (id, company_id, type, number, status, total_amount, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE 
      SET status = EXCLUDED.status, total_amount = EXCLUDED.total_amount, updated_at = NOW()
      RETURNING id;
    `;
    await db.query(syncDocQuery, [id, companyId, type, number, status, Number(totalAmount)]);

    await db.query('DELETE FROM document_items WHERE document_id = $1;', [id]);

    for (const item of items) {
      const finalProductId = item.product_id || item.productId || null;
      const itemQuery = `
        INSERT INTO document_items (document_id, product_id, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5);
      `;
      await db.query(itemQuery, [
        id, 
        finalProductId, 
        item.quantity, 
        item.unit_price || item.unitPrice || 0, 
        item.total_price || item.totalPrice || 0
      ]);
    }

    await db.query('COMMIT');
    logger.info({ documentId: id, number }, '[REM SALES SYNC SUCCESS] Document et stocks synchronisés dans Neon');

    res.status(201).json({
      success: true,
      message: 'Document de vente et stocks synchronisés avec succès',
      documentId: id
    });
  } catch (error: any) {
    await db.query('ROLLBACK');
    logger.error(error, '[REM SALES SYNC ERROR] Échec de la transaction de synchronisation');
    
    if (error.code === '23505') {
      res.status(409).json({ error: 'Un document avec ce numéro ou cet identifiant existe déjà.' });
      return;
    }

    res.status(500).json({ error: 'Erreur fatale lors de l\'écriture synchronisée en base.' });
  }
};

// ==========================================
// 5. RÉCUPÉRATION PAGINÉE ET FILTRÉE
// ==========================================
export const getSalesDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.company_id || req.query.companyId || (req as any).user?.companyId;

    if (!companyId) {
      res.status(400).json({ success: false, error: "Missing company identity" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const offset = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';

    let queryConditions = 'WHERE d.company_id = $1';
    const queryParams: any[] = [companyId];
    let paramIndex = 2;

    if (status) {
      queryConditions += ` AND d.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      queryConditions += ` AND (d.number ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex} OR r.name ILIKE $${paramIndex} OR r.deposit_name ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const dataQuery = `
      SELECT 
        d.id, 
        d.number, 
        d.type, 
        d.status, 
        d.total_amount, 
        d.created_at, 
        c.name as client_name,
        r.name as reseller_name,
        r.deposit_name as depot_name
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      LEFT JOIN public.resellers r ON d.reseller_id = r.id
      ${queryConditions}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;
    const finalDataParams = [...queryParams, limit, offset];

    const countQuery = `
      SELECT COUNT(*) 
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      LEFT JOIN public.resellers r ON d.reseller_id = r.id
      ${queryConditions};
    `;

    console.log(`[REM BACKEND] Exécution de la recherche paginée pour l'entreprise : ${companyId}`);

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, finalDataParams),
      db.query(countQuery, queryParams)
    ]);

    const totalItems = parseInt(countResult.rows[0].count) || 0;
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      success: true,
      data: dataResult.rows,
      meta: {
        totalItems,
        totalPages,
        currentPage: page,
        limit
      }
    });

  } catch (error) {
    console.error("❌ [BACKEND ERROR 500] Échec de l'extraction des ventes :", error);
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error)
    });
  }
};