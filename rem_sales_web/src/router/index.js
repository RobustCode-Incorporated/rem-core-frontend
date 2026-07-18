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
    { path: '/confidentiality-agreement', component: () => import('../views/ConfidentialityAgreement.vue') },
    { path: '/reseller-dashboard', component: ResellerDashboard },
    { 
      path: '/dashboard', 
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true, requiresPremium: true }
    },
    // Redirection automatique vers le dashboard si une route inconnue est appelée
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
  ]
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const planType = localStorage.getItem('plan_type'); 
  const isPremium = localStorage.getItem('is_premium') === 'true';

  if (to.meta.requiresAuth && !token) {
    return next('/login');
  }

  if (to.meta.requiresPremium) {
    if (planType === 'unlimited' || isPremium || to.query.status === 'success') {
      return next();
    } else {
      return next('/billing');
    }
  }
  next();
});

export default router;
