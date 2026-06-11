import { Router } from 'express';
import { requestRestock } from '../controllers/restock.controller';
import { 
  getResellersLiveLocation, 
  getResellerPerformance,
  createResellerWithAccess,
  getMyStock // 🎯 Import ajouté
} from '../controllers/resellers.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import getMyStock = require('../controllers/resellers.controller');

const router = Router();

/**
 * @route   POST /api/resellers/create-with-access
 * @desc    Création transactionnelle d'un revendeur et de ses accès utilisateurs
 * @access  Protégé (Réservé aux admins)
 */
router.post('/create-with-access', requireAuth, createResellerWithAccess);
router.post('/restock-request', requireAuth, requestRestock);

/**
 * @route   GET /api/resellers
 * @desc    Route racine requise par ResellerForm.vue pour lister les revendeurs
 * @access  Protégé
 */
router.get('/', requireAuth, getResellersLiveLocation);

/**
 * @route   GET /api/resellers/live-location
 * @desc    Extraction cartographique des positions des revendeurs
 * @access  Protégé
 */
router.get('/live-location', requireAuth, getResellersLiveLocation);

/**
 * @route   GET /api/resellers/:id/performance
 * @desc    Données analytiques et financières d'un revendeur ciblé
 * @access  Protégé
 */
router.get('/:id/performance', requireAuth, getResellerPerformance);
router.get('/my-stock', requireAuth, getMyStock);

// 🎯 L'export nommé attendu par src/app.ts
export const resellerRouter = router;