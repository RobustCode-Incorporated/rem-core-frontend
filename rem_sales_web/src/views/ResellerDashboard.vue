<template>
  <div class="dashboard-container">
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
      <component :is="activeComponent" />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// 1. IMPORTATIONS OBLIGATOIRES (Vérifie bien que ces fichiers existent !)
import DashboardModule from '../components/DashboardModule.vue'
import OrderModule from '../components/OrderModule.vue'
import StatsModule from '../components/StatsModule.vue'
import HistoryModule from '../components/SalesReconciliation.vue'
import GeolocationModule from '../components/GeolocationModule.vue'

const router = useRouter()
const currentTab = ref('dashboard')
const userRole = localStorage.getItem('userRole') || 'STAFF'

const menuItems = computed(() => [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'order', label: 'Faire une vente' },
  { id: 'stats', label: 'Statistiques' },
  { id: 'history', label: 'Mes Ventes' },
  { id: 'geo', label: 'Ma Position' }
])

// 2. MAPPAGE DES COMPOSANTS
const activeComponent = computed(() => {
  const map = {
    dashboard: DashboardModule,
    order: OrderModule,
    stats: StatsModule,
    history: HistoryModule,
    geo: GeolocationModule
  }
  return map[currentTab.value] || DashboardModule
})

const logout = () => {
  localStorage.clear()
  router.push('/login')
}
</script>

<style scoped>
/* (Garde tes styles actuels, ils sont excellents pour l'identité visuelle REM) */
.dashboard-container { display: flex; flex-direction: column; height: 100vh; background: #FFFAFA; font-family: 'ABeeZee', sans-serif; }
.top-navbar { background: #000; display: flex; justify-content: space-between; align-items: center; padding: 10px 40px; }
.brand-zone { display: flex; flex-direction: column; align-items: center; }
.logo-top { width: 140px; height: auto; }
.brand-title { color: #FFFAFA; font-size: 0.65rem; letter-spacing: 1.5px; text-transform: uppercase; margin: 0; }
.nav-right { display: flex; align-items: center; gap: 25px; }
.nav-menu { display: flex; gap: 20px; }
.nav-item { background: transparent; color: #A0A0A0; border: none; cursor: pointer; font-size: 0.85rem; transition: 0.2s; }
.nav-item:hover, .nav-item.active { color: #fff; }
.logout-btn { background: transparent; color: #fff; border: 1px solid #333; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; cursor: pointer; }
.logout-btn:hover { background: #fff; color: #000; }
.content-area { flex: 1; padding: 30px 50px; overflow-y: auto; }
</style>