<template>
  <div class="analytics-wrapper">
    
    <div class="analytics-lead">
      <h2>Suivi Analytique Global</h2>
      <p>Analyse multi-tenant en temps réel du flux transactionnel Neon Core</p>
    </div>

    <div class="card-section-container">
      <ResellersMap />
    </div>

    <div class="metrics-grid">
      <div class="metric-card black-card">
        <span class="card-label">CA Flux Dépôt (Factures Restock)</span>
        <h3 class="card-number total-direct">{{ revenueDirect.toLocaleString() }} $</h3>
        <span class="card-status status-up">▲ Encaissé Logistique</span>
      </div>
      
      <div class="metric-card black-card">
        <span class="card-label">CA Ventes Revendeurs (Caisse)</span>
        <h3 class="card-number total-reseller">{{ revenueResellers.toLocaleString() }} $</h3>
        <span class="card-status status-reseller">▲ Terminaux Distants</span>
      </div>

      <div class="metric-card black-card">
        <span class="card-label">Volume Transactions</span>
        <h3 class="card-number">{{ salesStore.sales.length }}</h3>
        <span class="card-status status-sync">● Éléments Synchronisés</span>
      </div>

      <div class="metric-card black-card">
        <span class="card-label">Panier Moyen Global</span>
        <h3 class="card-number">{{ averageBasket.toFixed(2) }} $</h3>
        <span class="card-status status-up">▲ Intensité du Flux</span>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-box clean-chart">
        <h3>Statuts des Restocks Logistiques (Dépôt)</h3>
        <div v-if="hasRestockData" class="chart-render-zone">
          <apexchart type="donut" :options="donutOptionsRestock" :series="restockSeries"></apexchart>
        </div>
        <div v-else class="empty-chart-fallback">
          <p>📦 Aucun flux de restockage enregistré actuellement</p>
        </div>
      </div>

      <div class="chart-box clean-chart">
        <h3>Statuts des Ventes Revendeurs</h3>
        <div v-if="hasSalesData" class="chart-render-zone">
          <apexchart type="donut" :options="donutOptionsSales" :series="salesSeries"></apexchart>
        </div>
        <div v-else class="empty-chart-fallback">
          <p>💰 Aucune vente enregistrée sur le réseau distant</p>
        </div>
      </div>

      <div class="chart-box clean-chart full-width-chart">
        <h3>Évolution Temporelle des Flux Globaux</h3>
        <apexchart type="area" :options="lineOptions" :series="lineData.series"></apexchart>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useSalesStore } from '../stores/sales'
import ResellersMap from './ResellersMap.vue'

const salesStore = useSalesStore()

onMounted(() => {
  console.log("[UX LOG] Initialisation de AnalyticsDashboard. Synchro globale active.");
  if (salesStore.sales.length === 0) {
    salesStore.fetchSales() 
  }
})

// --- 📊 CALCULS KPI FINANCIERS ---

// CA Ventes Directes du Dépôt = Factures de type 'RESTOCK' validées (PAID / COMPLETED)
const revenueDirect = computed(() => {
  return salesStore.sales
    .filter(s => {
      const type = String(s.type || '').toUpperCase();
      const status = String(s.status || '').toUpperCase();
      const isPaid = ['PAID', 'COMPLETED', 'PAYÉ', 'PAYE'].includes(status);
      
      const isRestockType = type.includes('RESTOCK') || type.includes('STOCK');
      const isDirectSale = !s.reseller_name && !s.reseller_id && ['SALE', 'VENTE', 'FACTURE'].includes(type);
      
      return (isRestockType || isDirectSale) && isPaid;
    })
    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0)
})

// CA Revendeurs = Documents de vente liés à un agent/revendeur
const revenueResellers = computed(() => {
  return salesStore.sales
    .filter(s => {
      const type = String(s.type || '').toUpperCase();
      const status = String(s.status || '').toUpperCase();
      const isPaid = ['PAID', 'COMPLETED', 'PAYÉ', 'PAYE'].includes(status);
      
      const isSale = ['SALE', 'VENTE', 'FACTURE'].includes(type);
      const isReseller = !!s.reseller_name || !!s.reseller_id || !!s.resellerId;
      
      return isSale && isReseller && isPaid;
    })
    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0)
})

// Panier Moyen Réel
const averageBasket = computed(() => {
  const totalPaidSales = salesStore.sales.filter(s => 
    ['PAID', 'COMPLETED', 'PAYÉ', 'PAYE'].includes(String(s.status).toUpperCase())
  ).length;
  const globalRevenue = revenueDirect.value + revenueResellers.value;
  return totalPaidSales ? globalRevenue / totalPaidSales : 0;
})


// --- 🍩 CONFIGURATION DYNAMIQUE DES DONUTS SÉPARÉS ---

// Donut 1 : Analyse des flux RESTOCK (Avec tolérance accrue sur les statuts d'attente)
const restockSeries = computed(() => {
  const restocks = salesStore.sales.filter(s => {
    const type = String(s.type || '').toUpperCase();
    return type.includes('RESTOCK') || type.includes('STOCK');
  });

  // Filtrage des différents états avec tolérance de vocabulaire API
  const paidCount = restocks.filter(s => ['PAID', 'COMPLETED', 'PAYÉ', 'PAYE'].includes(String(s.status || '').toUpperCase())).length;
  
  // Prise en compte de 'DRAFT', 'PENDING', 'BROUILLON' et 'PROCESSING' pour les brouillons/attentes
  const draftCount = restocks.filter(s => ['DRAFT', 'BROUILLON', 'PENDING', 'PROCESSING', 'EN_ATTENTE'].includes(String(s.status || '').toUpperCase())).length;
  
  const cancelledCount = restocks.filter(s => ['CANCELLED', 'ANNULÉ', 'ANNULE', 'REJECTED'].includes(String(s.status || '').toUpperCase())).length;
  
  // LOG DE SÉCURITÉ STATUTS RESTOCK
  if (restocks.length > 0) {
    console.log(`📊 [REM RESTOCK STATUTS] Total Restocks: ${restocks.length} | Validés: ${paidCount} | En attente/Draft: ${draftCount} | Annulés: ${cancelledCount}`);
    console.log(`📊 [REM RESTOCK STATUTS] Échantillon de statuts trouvés dans vos données :`, restocks.map(r => r.status));
  }

  return [paidCount, draftCount, cancelledCount];
})

// Donut 2 : Analyse exclusive des flux SALES / VENTES
const salesSeries = computed(() => {
  const sales = salesStore.sales.filter(s => ['SALE', 'VENTE', 'FACTURE'].includes(String(s.type || '').toUpperCase()))
  
  const paid = sales.filter(s => ['PAID', 'COMPLETED', 'PAYÉ', 'PAYE'].includes(String(s.status || '').toUpperCase())).length
  const draft = sales.filter(s => ['DRAFT', 'BROUILLON', 'PENDING'].includes(String(s.status || '').toUpperCase())).length
  const cancelled = sales.filter(s => ['CANCELLED', 'ANNULÉ', 'ANNULE'].includes(String(s.status || '').toUpperCase())).length
  
  return [paid, draft, cancelled]
})

// Sécurités de données pour bloquer le crash d'ApexCharts si tableaux vides [0, 0, 0]
const hasRestockData = computed(() => restockSeries.value.reduce((a, b) => a + b, 0) > 0)
const hasSalesData = computed(() => salesSeries.value.reduce((a, b) => a + b, 0) > 0)

// Configuration esthétique standard épurée (Pas de fond noir forcé)
const baseDonutOptions = {
  colors: ['#10b981', '#f59e0b', '#ef4444'], // Vert (Validé), Orange (En attente/Draft), Rouge (Annulé)
  stroke: { colors: ['#ffffff'], width: 2 },
  legend: { position: 'bottom', labels: { colors: '#111111' }, fontFamily: 'system-ui, sans-serif' },
  chart: { background: 'transparent' }
}

const donutOptionsRestock = { ...baseDonutOptions, labels: ['Restocks Validés', 'En attente / Draft', 'Annulés'] }
const donutOptionsSales = { ...baseDonutOptions, labels: ['Payées', 'Brouillons', 'Annulées'] }


// --- 📈 SUIVI CHRONOLOGIQUE DYNAMIQUE ---

const lineData = computed(() => {
  const activeSales = salesStore.sales
    .filter(s => ['PAID', 'COMPLETED', 'PAYÉ', 'PAYE'].includes(String(s.status || '').toUpperCase()))
    .map(s => ({
      amount: Number(s.total_amount || 0),
      date: s.created_at ? new Date(s.created_at) : new Date()
    }))
    .sort((a, b) => a.date - b.date);

  const monthsLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dataMap = {};

  activeSales.forEach(s => {
    const label = `${monthsLabels[s.date.getMonth()]} ${s.date.getFullYear().toString().slice(-2)}`;
    dataMap[label] = (dataMap[label] || 0) + s.amount;
  });

  const categories = Object.keys(dataMap);
  const data = Object.values(dataMap);

  if (categories.length === 0) {
    return { series: [{ name: 'Volume de ventes ($)', data: [0] }], categories: ['Aucun flux'] };
  }

  return {
    series: [{ name: 'Volume global consolidé ($)', data }],
    categories
  };
})

const lineOptions = computed(() => ({
  chart: { toolbar: { show: false }, background: 'transparent', fontFamily: 'system-ui, sans-serif' },
  stroke: { curve: 'smooth', colors: ['#111111'], width: 2.5 },
  grid: { borderColor: '#eaeaea' },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.15, opacityTo: 0, stops: [0, 90, 100] }
  },
  xaxis: { 
    categories: lineData.value.categories,
    labels: { style: { colors: '#666666' } }
  },
  yaxis: { labels: { style: { colors: '#666666' } } }
}))
</script>

<style scoped>
.analytics-wrapper {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-bottom: 40px;
}

.analytics-lead h2 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #000000;
  margin: 0 0 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.analytics-lead p {
  font-size: 0.85rem;
  color: #707070;
  margin: 0;
}

.card-section-container {
  width: 100%;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.black-card {
  background: #111111 !important;
  color: #ffffff !important;
  border: 1px solid #222222 !important;
  border-radius: 12px !important;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  color: #888888;
  letter-spacing: 0.8px;
  font-weight: 600;
}
.card-number {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
}
.total-direct { color: #ffffff; }
.total-reseller { color: #3b82f6; } 

.card-status {
  font-size: 0.72rem;
  font-weight: bold;
}
.card-status.status-up { color: #10b981; }
.card-status.status-reseller { color: #3b82f6; }
.card-status.status-sync { color: #a855f7; }

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 24px;
}

.clean-chart {
  background: #ffffff !important;
  color: #111111 !important;
  border: 1px solid #e5e5e5 !important;
  border-radius: 12px !important;
  padding: 24px;
}

.clean-chart h3 {
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #111111;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.empty-chart-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 220px;
  color: #777;
  font-size: 0.82rem;
  border: 1px dashed #e2e8f0;
  border-radius: 8px;
  background: #fafafa;
}

.full-width-chart {
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>