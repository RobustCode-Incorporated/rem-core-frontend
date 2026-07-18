<template>
  <div class="dashboard-container">
    <header class="top-navbar">
      <div class="brand-zone">
        <img src="../assets/RobustCodelogowhite.png" alt="Logo REM" class="logo-top" />
        <h1 class="brand-title">ROBUST ENTERPRISE MANAGEMENT</h1>
      </div>

      <div class="nav-right">
        <nav class="nav-menu">
          <button v-for="tab in tabs" :key="tab.id" 
                  :class="['nav-item', { active: currentTab === tab.id }]"
                  @click="currentTab = tab.id">
            {{ tab.label }}
          </button>
        </nav>
        <!-- Bouton harmonisé -->
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

// Imports des modules applicatifs
import DashboardStats from '../components/DashboardStats.vue';
import QuickSale from '../components/QuickSale.vue';
import RestockModule from '../components/RestockModule.vue';
import SalesHistory from '../components/SalesHistory.vue';
import GeolocationModule from '../components/GeolocationModule.vue';

const router = useRouter();
const currentTab = ref('dashboard');

// Structure des onglets nettoyée de toute pollution visuelle
const tabs = [
  { id: 'dashboard', label: 'Vue d\'ensemble' },
  { id: 'pos', label: 'Caisse' },
  { id: 'restock', label: 'Stock & Commande' },
  { id: 'history', label: 'Historique' },
  { id: 'geo', label: 'Position' }
];

const activeComponent = computed(() => {
  const map = {
    dashboard: DashboardStats,
    pos: QuickSale,
    restock: RestockModule,
    history: SalesHistory,
    geo: GeolocationModule
  };
  return map[currentTab.value];
});

const logout = () => {
  localStorage.clear();
  router.push('/login');
};
</script>

<style scoped>
.dashboard-container { 
  display: flex; 
  flex-direction: column; 
  min-height: 100svh;
  background: #FFFAFA; 
  font-family: 'ABeeZee', sans-serif; 
}

.top-navbar {
  background: #000000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 40px; 
  border-bottom: 1px solid #111111;
}

.brand-zone { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
}

.logo-top { width: 120px; height: auto; margin-bottom: 4px; }

.brand-title { 
  color: #FFFAFA; 
  font-size: 0.60rem; 
  letter-spacing: 2px; 
  font-weight: 400; 
  text-transform: uppercase;
  margin: 0;
  opacity: 0.9;
}

.nav-right { display: flex; align-items: center; gap: 30px; }
.nav-menu { display: flex; gap: 24px; }

.nav-item {
  background: transparent;
  color: #888888;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: color 0.2s ease;
  padding: 6px 0;
  position: relative;
}

/* Effet de surbrillance sobre et pro pour l'onglet actif */
.nav-item:hover, .nav-item.active { 
  color: #ffffff; 
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #ffffff;
}

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

.content-area { 
  flex: 1; 
  padding: 40px; 
  overflow-y: auto; 
}

@media (max-width: 900px) {
  .top-navbar {
    padding: 10px 14px;
    align-items: flex-start;
    gap: 10px;
  }
  .nav-right {
    width: 100%;
    justify-content: space-between;
    gap: 10px;
  }
  .nav-menu {
    gap: 14px;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .content-area {
    padding: 16px 12px;
  }
}
</style>
