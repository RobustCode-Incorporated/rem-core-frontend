import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import ResellerDashboard from '../views/ResellerDashboard.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' }, 
    { path: '/login', component: Login },
    { path: '/register', component: () => import('../views/RegisterCompany.vue') },
    { path: '/billing', component: () => import('../views/Billing.vue') },
    { path: '/settings', component: () => import('../views/Settings.vue'), meta: { requiresAuth: true } },
    { path: '/reseller-dashboard', component: ResellerDashboard },
    { 
      path: '/dashboard', 
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true, requiresPremium: true } // Double verrouillage
    }
  ]
});

// Le "Router Guard" : Version optimisée avec détection du Bypass Administrateur
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const planType = localStorage.getItem('plan_type'); // 'unlimited', 'free', etc.
  const isPremium = localStorage.getItem('is_premium') === 'true';

  // 1. Vérification de l'authentification de base
  if (to.meta.requiresAuth && !token) {
    return next('/login');
  }

  // 2. Vérification de la barrière de paiement Premium
  if (to.meta.requiresPremium) {
    // 🎯 LE BYPASS : Si tu es configuré en 'unlimited' dans ton localStorage, la barrière s'ouvre immédiatement
    if (planType === 'unlimited' || isPremium) {
      return next();
    } else {
      // Pas payé et pas Admin ? Direction la page d'abonnement / d'essai 30 jours
      return next('/billing');
    }
  }

  next();
});

export default router;