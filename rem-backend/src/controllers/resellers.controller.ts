import { Request, Response } from 'express';
import { db } from '../config/db';
import bcrypt from 'bcrypt';

/**
 * @desc    Création transactionnelle d'un revendeur et de ses accès
 * @route   POST /api/resellers/create-with-access
 */
export const createResellerWithAccess = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password, phone, deposit_name, company_id } = req.body;

  if (!firstName || !lastName || !email || !password || !company_id) {
    res.status(400).json({ success: false, message: "Champs obligatoires manquants." });
    return;
  }

  try {
    // 1. Hash du mot de passe
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await db.query('BEGIN');

    // 2. Création de l'utilisateur (pour l'authentification)
    const userQuery = `
      INSERT INTO public.users (company_id, first_name, last_name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5, 'STAFF', true)
      RETURNING id;
    `;
    const userRes = await db.query(userQuery, [company_id, firstName, lastName, email, passwordHash]);
    const userId = userRes.rows[0].id;

    // 3. Création du profil revendeur (pour le métier)
    const resellerQuery = `
      INSERT INTO public.resellers (id, company_id, name, email, phone, deposit_name, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;
    const fullName = `${firstName} ${lastName}`;
    await db.query(resellerQuery, [userId, company_id, fullName, email, phone, deposit_name, passwordHash]);

    await db.query('COMMIT');

    res.status(201).json({ success: true, message: "Revendeur créé avec succès.", userId });

  } catch (error: any) {
    await db.query('ROLLBACK');
    console.error("❌ [CONTROLLER ERROR] createResellerWithAccess :", error);
    res.status(500).json({ success: false, message: "Erreur lors de la création.", details: error.message });
  }
};

/**
 * @desc    Extraction cartographique synchrone
 */
export const getResellersLiveLocation = async (req: Request, res: Response): Promise<void> => {
  const companyId = (req.query.company_id as string) || '943e411e-9c4c-484f-9dde-9db708f5159a';

  try {
    const result = await db.query(
      `SELECT id, name, email, phone, deposit_name, latitude, longitude 
       FROM public.resellers 
       WHERE company_id = $1`,
      [companyId]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Erreur lors de la récupération." });
  }
};

/**
 * @desc    Tableau de bord financier agrégé
 */
export const getResellerPerformance = async (req: Request, res: Response): Promise<void> => {
  const resellerId = req.params.id;
  const companyId = req.query.company_id as string;

  try {
    const resellerRes = await db.query(
      `SELECT id, name, deposit_name FROM public.resellers WHERE id = $1 AND company_id = $2`,
      [resellerId, companyId]
    );

    if (resellerRes.rows.length === 0) {
      res.status(404).json({ success: false, message: "Revendeur introuvable." });
      return;
    }

    const financialsQuery = `
      SELECT status, SUM(total_amount) as total_revenue, COUNT(id) as total_invoices
      FROM public.documents
      WHERE reseller_id = $1 AND company_id = $2 AND type = 'FACTURE'
      GROUP BY status
    `;
    const financialsRes = await db.query(financialsQuery, [resellerId, companyId]);

    const topProductsQuery = `
      SELECT p.name as product_name, SUM(di.quantity)::int as units_sold
      FROM public.document_items di
      JOIN public.products p ON di.product_id = p.id
      JOIN public.documents d ON di.document_id = d.id
      WHERE d.reseller_id = $1 AND d.company_id = $2
      GROUP BY p.name ORDER BY units_sold DESC LIMIT 3
    `;
    const topProductsRes = await db.query(topProductsQuery, [resellerId, companyId]);

    res.status(200).json({
      success: true,
      reseller: resellerRes.rows[0],
      analytics: {
        financials: financialsRes.rows,
        topProducts: topProductsRes.rows
      }
    });

  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

export const getMyStock = async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  
  try {
    // On sélectionne tous les produits de l'entreprise, 
    // et on y associe le stock du revendeur (0 par défaut)
    const query = `
      SELECT 
        p.id as product_id, 
        p.name as product_name, 
        COALESCE(rs.quantity, 0) as quantity,
        COALESCE(rs.min_threshold, 5) as min_threshold
      FROM public.products p
      LEFT JOIN public.reseller_stocks rs ON p.id = rs.product_id AND rs.reseller_id = $1
      WHERE p.company_id = $2
    `;
    
    const result = await db.query(query, [user.id, user.companyId]);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors du chargement du catalogue." });
  }
};