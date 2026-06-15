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

// Le "Router Guard" : Mis à jour avec tolérance pour le retour de paiement Stripe
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const planType = localStorage.getItem('plan_type'); 
  const isPremium = localStorage.getItem('is_premium') === 'true';

  // 1. Vérification de l'authentification de base
  if (to.meta.requiresAuth && !token) {
    return next('/login');
  }

  // 2. Vérification de la barrière de paiement Premium
  if (to.meta.requiresPremium) {
    // 🎯 RECONNAISSANCE DU SUCCÈS : Si l'utilisateur est admin, déjà premium, OR s'il revient tout juste de valider son paiement Stripe
    if (planType === 'unlimited' || isPremium || to.query.status === 'success') {
      return next();
    } else {
      // Pas payé, pas Admin et pas en retour de paiement ? Redirection vers les plans
      return next('/billing');
    }
  }

  next();
});

export default router;