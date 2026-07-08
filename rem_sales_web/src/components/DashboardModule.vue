<template>
  <div class="dashboard-module">
    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Ventes du Jour</h3>
        <p class="metric-value">{{ todaySalesTotal.toLocaleString() }} $</p>
      </div>
      <div class="metric-card">
        <h3>Commandes en attente</h3>
        <p class="metric-value">{{ pendingOrdersCount }}</p>
      </div>
      <div class="metric-card">
        <h3>Articles en Stock</h3>
        <p class="metric-value">{{ stockList.length }}</p>
      </div>
    </div>

    <div class="inventory-section">
      <div class="section-header">
        <h2>Mon Inventaire Magasin</h2>
        <button @click="fetchResellerStock" class="refresh-btn">Actualiser</button>
      </div>

      <div v-if="stockLoading" class="loading-feedback">
        Analyse et synchronisation du stock magasin en cours...
      </div>

      <div v-else-if="stockList.length === 0" class="empty-stock-feedback">
        ⚠️ Aucun article en stock. Passez un bon de commande (Restock).
      </div>

      <div v-else class="table-wrapper">
        <table class="inventory-table">
          <thead>
            <tr>
              <th>ID Produit</th>
              <th>Désignation du Produit</th>
              <th class="text-center">Quantité Physique</th>
              <th>Statut Alerte</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in stockList" :key="item.product_id">
              <td class="font-mono font-bold">{{ item.product_id?.slice(0, 8) }}...</td>
              <td class="font-bold product-name-cell">{{ item.product_name || 'Produit REM' }}</td>
              <td class="text-center font-bold" :class="{ 'low-stock': item.quantity <= 5 }">
                {{ item.quantity }} pces
              </td>
              <td>
                <span v-if="item.quantity === 0" class="stock-badge out">Rupture</span>
                <span v-else-if="item.quantity <= 5" class="stock-badge alert">Alerte Seuil</span>
                <span v-else class="stock-badge ok">Optimal</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const todaySalesTotal = ref(0)
const pendingOrdersCount = ref(0)

const stockList = ref([])
const stockLoading = ref(false)

const fetchResellerStock = async () => {
  stockLoading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/resellers/me/stock`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    stockList.value = response.data.data || response.data
  } catch (error) {
    console.error("❌ Erreur lors du chargement de l'inventaire revendeur :", error)
  } finally {
    stockLoading.value = false
  }
}

const fetchKpis = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/sales/documents`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 100 }
    })
    const docs = response.data.data || response.data
    
    if (Array.isArray(docs)) {
      pendingOrdersCount.value = docs.filter(d => d.type === 'RESTOCK_REQUEST' && d.status === 'DRAFT').length
      todaySalesTotal.value = docs
        .filter(d => d.status === 'PAID' && d.type === 'SALE')
        .reduce((acc, curr) => acc + Number(curr.total_amount), 0)
    }
  } catch (err) {
    console.error("Impossible de rafraîchir les KPIs", err)
  }
}

onMounted(() => {
  fetchKpis()
  fetchResellerStock()
})
</script>

<style scoped>
.dashboard-module { display: flex; flex-direction: column; gap: 20px; width: 100%; box-sizing: border-box; }

/* 🌟 Transformation du repeat(3, 1fr) en un auto-fit responsive */
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }

.metric-card { background: #000; color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.metric-card h3 { margin: 0 0 10px 0; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #A0A0A0; }
.metric-value { margin: 0; font-size: 1.5rem; font-weight: bold; word-break: break-all; }

.inventory-section { background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; width: 100%; box-sizing: border-box; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px; }
.section-header h2 { font-size: 1rem; margin: 0; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
.refresh-btn { background: #000; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; font-size: 0.8rem; cursor: pointer; white-space: nowrap; }

.loading-feedback, .empty-stock-feedback { padding: 30px; text-align: center; color: #64748b; font-style: italic; font-size: 0.9rem; }

/* 🌟 Wrapper pour gérer le défilement horizontal du tableau uniquement */
.table-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }

.inventory-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; min-width: 600px; /* Force une largeur min pour garder le tableau lisible quand on scroll */ }
.inventory-table th { background: #f8fafc; color: #475569; font-weight: 600; padding: 12px; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
.inventory-table td { padding: 12px; border-bottom: 1px solid #edf2f7; color: #1e293b; }

.font-mono { font-family: monospace; }
.font-bold { font-weight: bold; }
.text-center { text-align: center; }

.product-name-cell { min-width: 150px; } /* Sécurité pour le nom du produit */

.low-stock { color: #ef4444; background: #fee2e2; padding: 4px; border-radius: 4px; display: inline-block; }

.stock-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; white-space: nowrap; }
.stock-badge.ok { background: #d1fae5; color: #065f46; }
.stock-badge.alert { background: #fef3c7; color: #92400e; }
.stock-badge.out { background: #fee2e2; color: #991b1b; }

@media (min-width: 768px) {
  .dashboard-module { gap: 30px; }
  .metrics-grid { gap: 20px; }
  .inventory-section { padding: 24px; }
  .section-header h2 { font-size: 1.1rem; }
  .metric-value { font-size: 1.8rem; }
}
</style>