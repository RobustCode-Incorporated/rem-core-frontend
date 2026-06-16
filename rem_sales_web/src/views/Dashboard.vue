<template>
  <div class="dashboard-container">
    <div v-if="daysRemaining !== null && daysRemaining > 0" class="success-activation-banner">
      <div class="success-banner-content">
        <span>
          🚀 <strong>Mode PRO Cadeau Actif !</strong> Il vous reste <strong>{{ daysRemaining }} jours</strong> d'essai gratuit avec toutes les fonctionnalités débloquées.
          <span class="plan-badge">Abonnement futur : {{ formattedTargetPlan }}</span>
        </span>
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
        <!-- Rendu dynamique sécurisé -->
        <component :is="activeComponent" v-if="activeComponent" />
        <div v-else class="error-component">Erreur : Impossible de charger ce module.</div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import SalesReconciliation from '../components/SalesReconciliation.vue'
import InventoryAlerts from '../components/InventoryAlerts.vue'
import ProductForm from '../components/ProductForm.vue'
import ResellerForm from '../components/ResellerForm.vue'
import AnalyticsDashboard from '../components/AnalyticsDashboard.vue'
import Settings from '../components/Settings.vue' // ✅ Importation vérifiée

const router = useRouter()
const route = useRoute()
const currentTab = ref('dashboard')
const targetPlan = ref('')
const daysRemaining = ref(null)

const menuItems = [
  { id: 'dashboard', label: 'Statistiques' }, 
  { id: 'pos', label: 'Vente Rapide' },       
  { id: 'inventory', label: 'Suivi Stocks' },
  { id: 'products', label: 'Articles' },
  { id: 'Resellers', label: 'Revendeurs'},
  { id: 'settings', label: 'Paramètres' } // ✅ Clé minuscule 'settings'
]

const activeComponent = computed(() => {
  const components = {
    dashboard: AnalyticsDashboard, 
    pos: SalesReconciliation,      
    inventory: InventoryAlerts,
    products: ProductForm,
    Resellers: ResellerForm,
    settings: Settings // ✅ Liaison stricte
  }
  return components[currentTab.value]
})

const formattedTargetPlan = computed(() => {
  if (!targetPlan.value) return 'Non défini'
  return targetPlan.value.charAt(0).toUpperCase() + targetPlan.value.slice(1)
})

onMounted(async () => {
  const companyId = localStorage.getItem('companyId')
  const token = localStorage.getItem('token')
  const apiUrl = import.meta.env.VITE_API_URL || 'https://rem-core-backend.onrender.com/api'

  if (route.query.status === 'success') {
    const chosenPlan = route.query.chosen_plan || 'entrée'
    targetPlan.value = chosenPlan
    
    localStorage.setItem('plan_type', 'pro') 
    localStorage.setItem('chosen_plan', chosenPlan)
    localStorage.setItem('is_premium', 'true')
    
    await nextTick()
    router.replace({ query: {} })
  }

  if (companyId && token) {
    try {
      const response = await axios.get(`${apiUrl}/auth/companies/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const company = response.data.company || response.data

      if (company.trial_ends_at) {
        const end = new Date(company.trial_ends_at)
        const now = new Date()
        const diffTime = end.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        daysRemaining.value = diffDays > 0 ? diffDays : 0
      }

      if (company.chosen_plan) {
        targetPlan.value = company.chosen_plan
        localStorage.setItem('chosen_plan', company.chosen_plan)
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des données de l'essai :", err)
      targetPlan.value = localStorage.getItem('chosen_plan') || 'entrée'
      daysRemaining.value = 30
    }
  }
})

const logout = () => {
  localStorage.clear()
  router.push('/login')
}
</script>

<style scoped>
.dashboard-container { display: flex; flex-direction: column; height: 100vh; background: #FFFAFA; font-family: 'ABeeZee', sans-serif; }
.success-activation-banner { background: linear-gradient(90deg, #111111, #1b5e20); color: #ffffff; padding: 14px 40px; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(0,0,0,0.2); animation: slideDown 0.4s ease-out; }
.success-banner-content { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; }
.plan-badge { background: #fffa00; color: #000; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; margin-left: 10px; }
.top-navbar { background: #000; display: flex; justify-content: space-between; align-items: center; padding: 10px 40px; }
.brand-zone { display: flex; flex-direction: column; align-items: center; }
.logo-top { width: 140px; height: auto; margin-bottom: 2px; }
.brand-title { color: #FFFAFA; font-size: 0.65rem; letter-spacing: 1.5px; font-weight: 400; white-space: nowrap; text-transform: uppercase; margin: 0; }
.nav-right { display: flex; align-items: center; gap: 25px; }
.nav-menu { display: flex; gap: 20px; }
.nav-item { background: transparent; color: #A0A0A0; border: none; cursor: pointer; font-size: 0.85rem; transition: 0.2s; }
.nav-item:hover, .nav-item.active { color: #fff; }
.logout-btn { background: transparent; color: #fff; border: 1px solid #333; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; cursor: pointer; transition: 0.3s; }
.logout-btn:hover { background: #fff; color: #000; }
.content-area { flex: 1; padding: 30px 50px; overflow-y: auto; }
.error-component { color: #d32f2f; font-weight: bold; padding: 4px; text-align: center; }
@keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>
