import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'; // 🛡️ Import de la sécurité CORS
import pino from 'pino';
import { db } from './config/db';
import { salesRouter } from './routes/sales.routes';
import { authRouter } from './routes/auth.routes'; // 🔑 Routes d'authentification pour le mobile

const logger = pino({ transport: { target: 'pino-pretty' } });
const app = express();

// 🛡️ CONFIGURATION CORS : Autorise les connexions (Mobile Flutter, Portail Web Vue 3, GitHub Codespaces)
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key']
}));

app.use(express.json());

// Middleware de Log des requêtes HTTP entrantes (Pino Logger)
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url }, 'Requête HTTP entrante');
  next();
});

// ==========================================
// 📁 DÉCLARATION DES ROUTES API
// ==========================================

// 📱 Routes principales des ventes (Partagées Mobile & Web)
app.use('/api/sales', salesRouter);

// 🔑 Branchement des routes d'authentification
app.use('/api/auth', authRouter); 

// ==========================================
// 🌐 ENDPOINTS SPÉCIFIQUES POUR LE PORTAIL WEB VUE 3
// ==========================================

/**
 * @route   GET /api/products
 * @desc    Récupère le catalogue d'articles d'une entreprise pour le web
 * @access  Multi-tenant (via query param company_id)
 */
app.get('/api/products', async (req: Request, res: Response): Promise<void> => {
  const companyId = req.query.company_id;

  if (!companyId) {
    res.status(400).json({ error: 'Le paramètre company_id est obligatoire.' });
    return;
  }

  try {
    logger.info({ companyId }, '[REM API WEB] Récupération du catalogue de produits');
    const result = await db.query(
      'SELECT id, name, purchase_price, selling_price, stock_quantity, code, created_at FROM products WHERE company_id = $1 ORDER BY name ASC', 
      [companyId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    logger.error(error, '[REM API WEB ERROR] Échec du chargement des produits');
    res.status(500).json({ error: 'Erreur fatale lors de la récupération des produits.' });
  }
});

/**
 * @route   GET /api/sales
 * @desc    Récupère l'historique global des documents (factures/devis) pour le tableau de bord
 * @access  Multi-tenant (via query param company_id)
 */
app.get('/api/sales', async (req: Request, res: Response): Promise<void> => {
  const companyId = req.query.company_id;

  if (!companyId) {
    res.status(400).json({ error: 'Le paramètre company_id est obligatoire.' });
    return;
  }

  try {
    logger.info({ companyId }, '[REM API WEB] Récupération du suivi des ventes');
    const result = await db.query(
      'SELECT id, client_id, type, number, status, total_amount, created_at FROM documents WHERE company_id = $1 ORDER BY created_at DESC', 
      [companyId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    logger.error(error, '[REM API WEB ERROR] Échec du chargement des documents commerciaux');
    res.status(500).json({ error: 'Erreur fatale lors de la récupération des ventes.' });
  }
});

// ==========================================
// 🏥 DIAGNOSTIC DE SANTÉ (HEALTHCHECK)
// ==========================================
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Vérification de la liaison active avec Neon
    await db.query('SELECT NOW()');
    res.status(200).json({ status: 'UP', database: 'CONNECTED', timestamp: new Date() });
  } catch (error) {
    logger.error(error, 'Erreur critique lors du healthcheck');
    res.status(500).json({ status: 'DOWN', error: 'Database connection failed' });
  }
});

// ==========================================
// 🚀 LANCEMENT DU SERVEUR Express
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`[SERVER] Le REM Core tourne avec succès sur le port ${PORT}`);
});