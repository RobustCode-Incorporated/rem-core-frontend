<template>
  <div class="dashboard-container">
    <header class="top-navbar">
      <div class="brand-zone">
        <img src="../assets/RobustCodelogowhite.png" alt="Logo REM" class="logo-top" />
        <h1 class="brand-title">ROBUST ENTERPRISE MANAGEMENT</h1>
      </div>

      <button class="mobile-menu-toggle" @click="toggleMobileMenu" aria-label="Ouvrir le menu">
        {{ isMobileMenuOpen ? 'Fermer' : 'Menu' }}
      </button>

      <div class="nav-right desktop-nav-right">
        <nav class="nav-menu">
          <button v-for="tab in tabs" :key="tab.id" 
                  :class="['nav-item', { active: currentTab === tab.id }]"
                  @click="selectTab(tab.id)">
            {{ tab.label }}
          </button>
        </nav>
        <!-- Bouton harmonisé -->
        <button @click="logout" class="logout-btn">Déconnexion</button>
      </div>
    </header>

    <Transition name="mobile-overlay-fade">
      <div v-if="isMobileMenuOpen" class="mobile-menu-overlay" @click="closeMobileMenu"></div>
    </Transition>

    <Transition name="mobile-menu-slide">
      <aside v-if="isMobileMenuOpen" class="mobile-menu-panel" @click.stop>
        <nav class="mobile-nav-menu">
          <button
            v-for="tab in tabs"
            :key="`mobile-${tab.id}`"
            :class="['mobile-nav-item', { active: currentTab === tab.id }]"
            @click="selectTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </nav>
        <button @click="logoutAndCloseMenu" class="mobile-logout-btn">Déconnexion</button>
      </aside>
    </Transition>

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
const isMobileMenuOpen = ref(false);

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

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const selectTab = (tabId) => {
  currentTab.value = tabId;
  closeMobileMenu();
};

const logout = () => {
  localStorage.clear();
  router.push('/login');
};

const logoutAndCloseMenu = () => {
  closeMobileMenu();
  logout();
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

.mobile-menu-toggle {
  display: none;
  background: transparent;
  border: 1px solid #333;
  color: #fff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  cursor: pointer;
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

.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 40;
}

.mobile-menu-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: min(86vw, 340px);
  height: 100vh;
  background: #070707;
  border-left: 1px solid #222;
  z-index: 50;
  display: flex;
  flex-direction: column;
  padding: 84px 20px 20px;
  box-shadow: -16px 0 40px rgba(0, 0, 0, 0.45);
}

.mobile-nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-nav-item {
  text-align: left;
  background: transparent;
  color: #c1c1c1;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 12px 10px;
  font-size: 0.95rem;
  cursor: pointer;
}

.mobile-nav-item.active,
.mobile-nav-item:hover {
  color: #fff;
  border-color: #2f2f2f;
  background: #101010;
}

.mobile-logout-btn {
  margin-top: auto;
  background: transparent;
  color: #fff;
  border: 1px solid #333;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.9rem;
  cursor: pointer;
}

.mobile-overlay-fade-enter-active,
.mobile-overlay-fade-leave-active {
  transition: opacity 0.25s ease;
}

.mobile-overlay-fade-enter-from,
.mobile-overlay-fade-leave-to {
  opacity: 0;
}

.mobile-menu-slide-enter-active,
.mobile-menu-slide-leave-active {
  transition: transform 0.3s ease;
}

.mobile-menu-slide-enter-from,
.mobile-menu-slide-leave-to {
  transform: translateX(100%);
}

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

@media (max-width: 767px) {
  .desktop-nav-right {
    display: none;
  }

  .mobile-menu-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .top-navbar {
    padding: 10px 14px;
    flex-wrap: nowrap;
  }

  .brand-zone {
    min-width: 0;
    align-items: flex-start;
  }

  .logo-top {
    width: 105px;
  }

  .brand-title {
    font-size: 0.52rem;
    letter-spacing: 0.8px;
    white-space: normal;
    line-height: 1.2;
  }

  .content-area {
    padding: 14px 12px 20px;
  }
}
</style>
