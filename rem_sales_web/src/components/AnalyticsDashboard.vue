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

    <!-- 📊 NOUVELLE STRUCTURE DE GRILLE TRIPARTITE -->
    <div class="charts-layout">
      
      <!-- COLONNE GAUCHE : STATUTS -->
      <div class="side-column">
        <div class="chart-box clean-chart">
          <h3>Statuts des Restocks (Dépôt)</h3>
          <div v-if="hasRestockData" class="chart-render-zone">
            <apexchart type="donut" :options="donutOptionsRestock" :series="restockSeries" height="250"></apexchart>
          </div>
          <div v-else class="empty-chart-fallback">📦 Aucun restock</div>
        </div>

        <div class="chart-box clean-chart">
          <h3>Statuts des Ventes Revendeurs</h3>
          <div v-if="hasSalesData" class="chart-render-zone">
            <apexchart type="donut" :options="donutOptionsSales" :series="salesSeries" height="250"></apexchart>
          </div>
          <div v-else class="empty-chart-fallback">💰 Aucune vente</div>
        </div>
      </div>

      <!-- COLONNE CENTRALE : ÉVOLUTION TEMPORELLE -->
      <div class="center-column">
        <div class="chart-box clean-chart evolution-box">
          <h3>Évolution Temporelle des Flux Globaux</h3>
          <div class="evolution-render">
            <apexchart type="area" :options="lineOptions" :series="lineData.series" height="580"></apexchart>
          </div>
        </div>
      </div>

      <!-- COLONNE DROITE : PERFORMANCE & PRODUITS -->
      <div class="side-column">
        <div class="chart-box clean-chart">
          <h3>Parts du CA par Produit</h3>
          <div v-if="productData.series.length > 0" class="chart-render-zone">
            <apexchart type="donut" :options="donutOptionsProduct" :series="productData.series" height="250"></apexchart>
          </div>
          <div v-else class="empty-chart-fallback">📊 Chargement...</div>
        </div>

        <div class="chart-box clean-chart">
          <h3>Top Performance Revendeurs</h3>
          <div v-if="resellerPerformanceData.series.length > 0" class="chart-render-zone">
            <apexchart type="donut" :options="donutOptionsResellerPerf" :series="resellerPerformanceData.series" height="250"></apexchart>
          </div>
          <div v-else class="empty-chart-fallback">👥 Aucun CA actif</div>
        </div>
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
  const companyId = localStorage.getItem('companyId') || 'b95f3b70-9d08-4ea0-95ca-961cf7df688f'
  if (salesStore.sales.length === 0) salesStore.fetchSales() 
  salesStore.fetchProductAnalytics(companyId)
})

// --- 📊 CALCULS KPI ---
const revenueDirect = computed(() => {
  return salesStore.sales
    .filter(s => {
      const type = String(s.type || '').toUpperCase()
      const status = String(s.status || '').toUpperCase()
      const isPaid = ['PAID', 'COMPLETED', 'PAYÉ', 'PAYE'].includes(status)
      const hasReseller = !!s.reseller_id || !!s.resellerId || !!s.reseller_name
      return isPaid && (type.includes('RESTOCK') || (['SALE', 'VENTE'].includes(type) && !hasReseller))
    })
    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0)
})

const revenueResellers = computed(() => {
  return salesStore.sales
    .filter(s => {
      const type = String(s.type || '').toUpperCase()
      const status = String(s.status || '').toUpperCase()
      const isPaid = ['PAID', 'COMPLETED', 'PAYÉ', 'PAYE'].includes(status)
      const hasReseller = !!s.reseller_id || !!s.resellerId || !!s.reseller_name
      return isPaid && ['SALE', 'VENTE'].includes(type) && hasReseller
    })
    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0)
})

const averageBasket = computed(() => {
  const totalPaid = salesStore.sales.filter(s => ['PAID', 'COMPLETED', 'PAYÉ', 'PAYE'].includes(String(s.status || '').toUpperCase())).length
  return totalPaid ? (revenueDirect.value + revenueResellers.value) / totalPaid : 0
})

// --- 🍩 SERIES DATA ---
const restockSeries = computed(() => {
  const restocks = salesStore.sales.filter(s => String(s.type || '').toUpperCase().includes('STOCK'))
  return [
    restocks.filter(s => ['PAID', 'COMPLETED', 'PAYÉ', 'PAYE'].includes(String(s.status || '').toUpperCase())).length,
    restocks.filter(s => ['DRAFT', 'PENDING', 'EN_ATTENTE'].includes(String(s.status || '').toUpperCase())).length,
    restocks.filter(s => ['CANCELLED', 'ANNULE'].includes(String(s.status || '').toUpperCase())).length
  ]
})

const salesSeries = computed(() => {
  const sales = salesStore.sales.filter(s => {
    const type = String(s.type || '').toUpperCase()
    const hasReseller = !!s.reseller_id || !!s.resellerId || !!s.reseller_name
    return ['SALE', 'VENTE'].includes(type) && hasReseller
  })
  return [
    sales.filter(s => ['PAID', 'COMPLETED', 'PAYÉ', 'PAYE'].includes(String(s.status || '').toUpperCase())).length,
    sales.filter(s => ['DRAFT', 'PENDING'].includes(String(s.status || '').toUpperCase())).length,
    sales.filter(s => ['CANCELLED', 'ANNULE'].includes(String(s.status || '').toUpperCase())).length
  ]
})

const productData = computed(() => ({
  labels: salesStore.productAnalytics.map(i => i.product_name),
  series: salesStore.productAnalytics.map(i => Number(i.total_revenue))
}))

const resellerPerformanceData = computed(() => {
  const map = {}
  salesStore.sales
    .filter(s => ['PAID', 'COMPLETED', 'PAYÉ', 'PAYE'].includes(String(s.status || '').toUpperCase()) && s.reseller_name)
    .forEach(s => { map[s.reseller_name] = (map[s.reseller_name] || 0) + Number(s.total_amount || 0) })
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
  return { labels: sorted.map(i => i[0]), series: sorted.map(i => i[1]) }
})

const hasRestockData = computed(() => restockSeries.value.some(v => v > 0))
const hasSalesData = computed(() => salesSeries.value.some(v => v > 0))

// --- ⚙️ CHART OPTIONS ---
const baseDonutOptions = {
  stroke: { colors: ['#ffffff'], width: 2 },
  legend: { position: 'bottom', labels: { colors: '#111111' }, fontSize: '10px' },
  chart: { background: 'transparent' },
  dataLabels: { enabled: false }
}

const donutOptionsRestock = { ...baseDonutOptions, colors: ['#10b981', '#f59e0b', '#ef4444'], labels: ['Validés', 'Attente', 'Annulés'] }
const donutOptionsSales = { ...baseDonutOptions, colors: ['#10b981', '#f59e0b', '#ef4444'], labels: ['Payées', 'Brouillons', 'Annulées'] }
const donutOptionsProduct = computed(() => ({ ...baseDonutOptions, colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'], labels: productData.value.labels }))
const donutOptionsResellerPerf = computed(() => ({ ...baseDonutOptions, colors: ['#1e3a8a', '#3b82f6', '#93c5fd'], labels: resellerPerformanceData.value.labels }))

const lineData = computed(() => {
  const dataMap = {}
  salesStore.sales.filter(s => ['PAID', 'COMPLETED', 'PAYÉ', 'PAYE'].includes(String(s.status || '').toUpperCase()))
    .forEach(s => {
      const d = new Date(s.created_at)
      const key = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear().toString().slice(-2)}`
      dataMap[key] = (dataMap[key] || 0) + Number(s.total_amount)
    })
  return { series: [{ name: 'CA ($)', data: Object.values(dataMap) }], categories: Object.keys(dataMap) }
})

const lineOptions = computed(() => ({
  chart: { toolbar: { show: false }, background: 'transparent' },
  stroke: { curve: 'smooth', colors: ['#111111'], width: 3 },
  xaxis: { categories: lineData.value.categories, labels: { style: { colors: '#777' } } },
  yaxis: { labels: { style: { colors: '#777' } } },
  fill: { type: 'gradient', gradient: { opacityFrom: 0.2, opacityTo: 0 } },
  grid: { borderColor: '#f1f1f1' }
}))
</script>

<style scoped>
.analytics-wrapper { display: flex; flex-direction: column; gap: 32px; padding-bottom: 40px; }
.analytics-lead h2 { font-size: 1.4rem; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
.analytics-lead p { font-size: 0.85rem; color: #707070; }

.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
.black-card { background: #111111; color: #ffffff; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 8px; }
.card-label { font-size: 0.72rem; text-transform: uppercase; color: #888888; font-weight: 600; }
.card-number { font-size: 1.8rem; font-weight: 700; margin: 0; }
.card-status { font-size: 0.72rem; font-weight: bold; }
.card-status.status-up { color: #10b981; }

/* 🚀 DISPOSITION EN 3 COLONNES */
.charts-layout { 
  display: grid; 
  grid-template-columns: 1fr 1.6fr 1fr; 
  gap: 24px; 
  align-items: start;
}

.side-column { 
  display: flex; 
  flex-direction: column; 
  gap: 24px; 
}

.center-column {
  height: 100%;
}

.clean-chart { 
  background: #ffffff; 
  border: 1px solid #e5e5e5; 
  border-radius: 12px; 
  padding: 24px; 
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.evolution-box {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.clean-chart h3 { 
  font-size: 0.78rem; 
  font-weight: 800; 
  text-transform: uppercase; 
  border-bottom: 1px solid #f0f0f0; 
  padding-bottom: 12px; 
  margin-bottom: 20px; 
  color: #1a1a1a;
}

.empty-chart-fallback { 
  height: 180px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  color: #999; 
  background: #fafafa; 
  border: 1px dashed #e2e8f0; 
  border-radius: 8px; 
  font-size: 0.75rem;
}

/* RESPONSIVE : Passage en 1 colonne sur tablette/mobile */
@media (max-width: 1200px) {
  .charts-layout { grid-template-columns: 1fr; }
  .center-column { order: -1; } /* Met le grand graphique en haut sur mobile */
}
</style>