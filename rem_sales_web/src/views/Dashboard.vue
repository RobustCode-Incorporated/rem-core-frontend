<template>
  <div class="dashboard-container">
    <div v-if="showSuccessBanner" class="success-activation-banner">
      <div class="success-banner-content">
        <span>
          🚀 <strong>Période d'essai activée !</strong> Pour vous souhaiter la bienvenue, nous débloquons 
          <strong>toutes les fonctionnalités Professionnel</strong> pendant 30 jours. 
          <span class="plan-badge">Option future : {{ formattedTargetPlan }}</span>
        </span>
        <button @click="closeSuccessBanner" class="close-banner-btn">✕</button>
      </div>
    </div>

    <header class="top-navbar">
      <div class="brand-zone">
        <img src="../assets/RobustCodelogowhite.png" alt="Logo REM" class="logo-top" />
        <h1 class="brand-title">ROBUST ENTERPRISE MANAGEMENT</h1>
      </div>

      <div class="nav-right">
        <nav class="nav-menu">
          <button v-for="link in menuItems" :key="link.id" 
                  :class="['nav-item', { active: currentTab === link.id }]"
                  @click="currentTab = link.id">
            {{ link.label }}
          </button>
        </nav>
        <button @click="logout" class="logout-btn">Déconnexion</button>
      </div>
    </header>

    <main class="content-area">
      <section class="content-body">
        <component :is="activeComponent" />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SalesReconciliation from '../components/SalesReconciliation.vue'
import InventoryAlerts from '../components/InventoryAlerts.vue'
import ProductForm from '../components/ProductForm.vue'
import ResellerForm from '../components/ResellerForm.vue'
import AnalyticsDashboard from '../components/AnalyticsDashboard.vue'

const router = useRouter()
const route = useRoute()
const currentTab = ref('dashboard')
const showSuccessBanner = ref(false)
const targetPlan = ref('')

const menuItems = [
  { id: 'dashboard', label: 'Statistiques' }, 
  { id: 'pos', label: 'Vente Rapide' },       
  { id: 'inventory', label: 'Suivi Stocks' },
  { id: 'products', label: 'Articles' },
  { id: 'Resellers', label: 'Revendeurs'}
]

const activeComponent = computed(() => {
  const components = {
    dashboard: AnalyticsDashboard, 
    pos: SalesReconciliation,      
    inventory: InventoryAlerts,
    products: ProductForm,
    Resellers: ResellerForm
  }
  return components[currentTab.value]
})

// Formatage propre pour l'affichage utilisateur (ex: entrée -> Entrée)
const formattedTargetPlan = computed(() => {
  if (!targetPlan.value) return 'Non défini'
  return targetPlan.value.charAt(0).toUpperCase() + targetPlan.value.slice(1)
})

onMounted(async () => {
  // 1. On intercepte immédiatement les paramètres de l'URL
  if (route.query.status === 'success') {
    const chosenPlan = route.query.chosen_plan || 'standard'
    
    // 2. On affecte Directement la valeur à la réactivité Vue
    targetPlan.value = chosenPlan
    showSuccessBanner.value = true
    
    // 3. Stockage local pour accorder les droits maximaux 'pro'
    localStorage.setItem('plan_type', 'pro') 
    localStorage.setItem('chosen_plan', chosenPlan)
    localStorage.setItem('is_premium', 'true')
    
    // 4. On attend que Vue mette à jour l'affichage avant de nettoyer l'URL
    await nextTick()
    router.replace({ query: {} })
  } else {
    // Si on arrive normalement sans passer par Stripe, on récupère le plan cible stocké
    targetPlan.value = localStorage.getItem('chosen_plan') || 'standard'
  }
})

const closeSuccessBanner = () => {
  showSuccessBanner.value = false
}

const logout = () => {
  localStorage.clear()
  router.push('/login')
}
</script>

<style scoped>
.dashboard-container { 
  display: flex; 
  flex-direction: column; 
  height: 100vh; 
  background: #FFFAFA; 
  font-family: 'ABeeZee', sans-serif; 
}

/* Bandeau de bienvenue haut de gamme */
.success-activation-banner {
  background: linear-gradient(90deg, #111111, #1b5e20);
  color: #ffffff;
  padding: 14px 40px;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  animation: slideDown 0.4s ease-out;
}

.success-banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.plan-badge {
  background: #fffa00;
  color: #000;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.8rem;
  margin-left: 10px;
}

.close-banner-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
}
.close-banner-btn:hover { opacity: 1; }

.top-navbar {
  background: #000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 40px; 
}

.brand-zone { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
}

.logo-top { 
  width: 140px; 
  height: auto; 
  margin-bottom: 2px; 
}

.brand-title { 
  color: #FFFAFA; 
  font-size: 0.65rem; 
  letter-spacing: 1.5px; 
  font-weight: 400; 
  white-space: nowrap;
  text-transform: uppercase;
  margin: 0;
}

.nav-right { display: flex; align-items: center; gap: 25px; }
.nav-menu { display: flex; gap: 20px; }
.nav-item {
  background: transparent;
  color: #A0A0A0;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  transition: 0.2s;
}
.nav-item:hover, .nav-item.active { color: #fff; }

.logout-btn { 
  background: transparent; 
  color: #fff; 
  border: 1px solid #333; 
  padding: 6px 14px; 
  border-radius: 20px; 
  font-size: 0.75rem;
  cursor: pointer; 
  transition: 0.3s;
}
.logout-btn:hover { background: #fff; color: #000; }

.content-area { flex: 1; padding: 30px 50px; overflow-y: auto; }

@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>