import { Router } from 'express';
import { requestRestock } from '../controllers/restock.controller';
import { 
  getResellersLiveLocation, 
  getResellerPerformance,
  createResellerWithAccess,
  getMyStock 
} from '../controllers/resellers.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/resellers/me/stock
 * @desc    Récupération du stock avec indicateurs pour Donuts de Stock Optimal
 * @access  Protégé
 */
router.get('/me/stock', requireAuth, getMyStock);

router.post('/create-with-access', requireAuth, createResellerWithAccess);
router.post('/restock-request', requireAuth, requestRestock);

router.get('/', requireAuth, getResellersLiveLocation);
router.get('/live-location', requireAuth, getResellersLiveLocation);
router.get('/:id/performance', requireAuth, getResellerPerformance);

export const resellerRouter = router;