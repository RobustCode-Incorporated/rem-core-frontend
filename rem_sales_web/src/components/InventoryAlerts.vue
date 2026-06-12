<template>
  <div class="inventory-container">
    <div class="header-section">
      <h2>📊 État Global des Stocks</h2>
      <p class="subtitle">Vue d'ensemble du catalogue et indicateurs de complétion logistique</p>
    </div>

    <div v-if="catalogStore.loading" class="state-message">
      <span class="spinner"></span> Synchronisation du catalogue en cours...
    </div>

    <div v-else-if="catalogStore.error" class="state-message error">
      ❌ {{ catalogStore.error }}
      <br />
      <button @click="catalogStore.fetchProducts" class="btn-retry">Réessayer</button>
    </div>

    <div v-else>
      <div class="stats-grid">
        <div class="stat-card black-card">
          <div class="card-icon rupture-icon">🚨</div>
          <div class="card-content">
            <h3>Ruptures Totales</h3>
            <div class="metric text-danger">{{ catalogStore.outOfStockProducts.length }} <span class="unit">Réf.</span></div>
            <p class="trend urgent">Quantité à 0 absolue</p>
          </div>
        </div>

        <div class="stat-card black-card">
          <div class="card-icon warning-icon">⚠️</div>
          <div class="card-content">
            <h3>Seuils Critiques</h3>
            <div class="metric text-warning">{{ lowStockProducts.length }} <span class="unit">Réf.</span></div>
            <p class="trend">Sous la limite d'alerte</p>
          </div>
        </div>
      </div>

      <div class="inventory-section">
        <div class="section-title-zone">
          <h3>📦 Répartition de l'Inventaire Général</h3>
          <p class="section-subtitle">Statut visuel de chaque marchandise calculé selon son seuil de réapprovisionnement minimal</p>
        </div>

        <div v-if="catalogStore.products.length === 0" class="empty-stock">
          <p>Aucun produit n'est répertorié dans le catalogue pour le moment.</p>
        </div>

        <div v-else class="inventory-grid">
          <div v-for="product in allProductsWithStatus" :key="product.id" class="inventory-card">
            
            <div class="donut-wrapper">
              <div class="mini-donut" :style="getDonutStyle(product)">
                <div class="donut-center">
                  <span class="donut-qty">{{ product.displayQty }}</span>
                </div>
              </div>
            </div>

            <div class="inventory-details">
              <h4>{{ product.name }}</h4>
              <span :class="['stock-badge', product.statusClass]">
                {{ product.statusText }}
              </span>
              <p class="threshold-info">Seuil d'alerte : <strong>{{ product.alertThreshold }}</strong> u</p>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useCatalogStore } from '../stores/catalog'

const catalogStore = useCatalogStore()

// 1. Isolation réactive des produits sous le seuil d'alerte (Quantité > 0 mais <= minStockAlert)
const lowStockProducts = computed(() => {
  return catalogStore.products.filter(p => {
    const qty = parseFloat(p.stock_quantity || p.stockQuantity || 0)
    const alert = parseFloat(p.minStockAlert || 5)
    return qty > 0 && qty <= alert
  })
})

// 2. Mapping complet du catalogue avec injection des statuts visuels (Optimal, Alerte, Rupture)
const allProductsWithStatus = computed(() => {
  return catalogStore.products.map(p => {
    const qty = parseFloat(p.stock_quantity || p.stockQuantity || 0)
    const alert = parseFloat(p.minStockAlert || 5)

    let status = 'OPTIMAL'
    let statusClass = 'status-success'
    let statusText = `Optimal (≥ ${alert})`
    let percentage = 100 // Par défaut, cercle complet si le stock est au vert

    if (qty === 0) {
      status = 'CRITICAL'
      statusClass = 'status-danger'
      statusText = 'Rupture'
      percentage = 0
    } else if (qty <= alert) {
      status = 'WARNING'
      statusClass = 'status-warning'
      statusText = 'Stock critique'
      // Calcul du ratio de complétion par rapport au seuil fixé
      percentage = alert > 0 ? Math.min((qty / alert) * 100, 100) : 0
    }

    return {
      id: p.id,
      name: p.name,
      displayQty: qty,
      alertThreshold: alert,
      percentage,
      stock_status: status,
      statusClass,
      statusText
    }
  })
})

// 3. Calcul dynamique du background conique pour reproduire le rendu du Dashboard Stat
const getDonutStyle = (product) => {
  const deg = (product.percentage / 100) * 360
  let color = '#10b981' // Vert : Optimal
  
  if (product.stock_status === 'CRITICAL') {
    color = '#ef4444' // Rouge : Rupture
    return { background: color } // Cercle plein rouge pour marquer la rupture immédiate
  } else if (product.stock_status === 'WARNING') {
    color = '#f59e0b' // Orange : Warning
  }

  return { background: `conic-gradient(${color} ${deg}deg, #222222 ${deg}deg)` }
}

onMounted(() => {
  if (catalogStore.products.length === 0) {
    catalogStore.fetchProducts()
  }
})
</script>

<style scoped>
/* Conteneur et En-tête */
.inventory-container { padding: 24px; background-color: #fff; border-radius: 12px; font-family: system-ui, sans-serif; }
.header-section { margin-bottom: 30px; }
.header-section h2 { font-size: 1.8rem; color: #111; margin-bottom: 5px; font-weight: bold; }
.subtitle { color: #64748b; font-size: 0.95rem; }

/* Grille des Compteurs Globaux (Style Black Card importé) */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 25px; margin-bottom: 45px; }
.black-card { background: #111111; color: #ffffff; border-radius: 12px; padding: 25px; display: flex; align-items: flex-start; gap: 20px; border: 1px solid #222; }
.card-icon { font-size: 2.2rem; background: #1c1c1c; width: 55px; height: 55px; display: flex; align-items: center; justify-content: center; border-radius: 10px; }
.card-content h3 { font-size: 0.85rem; color: #888; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px; }
.metric { font-size: 2rem; font-weight: bold; margin: 0 0 4px 0; }
.unit { font-size: 0.9rem; color: #666; font-weight: normal; }
.trend { font-size: 0.8rem; color: #64748b; margin: 0; }
.trend.urgent { color: #ef4444; font-weight: 600; }
.text-danger { color: #ef4444; }
.text-warning { color: #f59e0b; }

/* Zone des Marchandises à Donuts */
.inventory-section { background: #fff; border: 1px solid #eee; border-radius: 14px; padding: 30px; }
.section-title-zone { margin-bottom: 25px; }
.section-title-zone h3 { font-size: 1.2rem; color: #111; margin: 0 0 4px 0; }
.section-subtitle { color: #777; font-size: 0.85rem; }

/* Grille des Donuts */
.inventory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
.inventory-card { background: #fafafa; border: 1px solid #f0f0f0; border-radius: 10px; padding: 20px; display: flex; align-items: center; gap: 20px; transition: border-color 0.2s ease; }
.inventory-card:hover { border-color: #cbd5e1; }

/* Mini Donut CSS */
.mini-donut { width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background 0.3s ease; }
.donut-center { width: 41px; height: 41px; background: #fafafa; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.donut-qty { font-size: 0.95rem; font-weight: bold; color: #111; }

/* Contenu textuel des cartes */
.inventory-details h4 { font-size: 0.95rem; color: #111; margin: 0 0 6px 0; font-weight: 700; line-height: 1.3; }
.threshold-info { font-size: 0.78rem; color: #64748b; margin: 6px 0 0 0; }

/* Badges de Statuts */
.stock-badge { font-size: 0.72rem; padding: 4px 8px; border-radius: 20px; font-weight: bold; text-transform: uppercase; display: inline-block; }
.status-success { background: #e6f4ea; color: #137333; }
.status-warning { background: #fef7e0; color: #b06000; }
.status-danger { background: #fce8e6; color: #c5221f; }
.empty-stock { text-align: center; padding: 40px; color: #666; font-style: italic; }

/* Feedbacks système */
.state-message { text-align: center; padding: 40px; color: #666; font-size: 0.95rem; }
.state-message.error { color: #c5221f; }
.btn-retry { margin-top: 15px; background: #111; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600; }
.spinner { width: 20px; height: 20px; border: 3px solid #eee; border-top-color: #111; border-radius: 50%; display: inline-block; animation: spin 1s linear infinite; vertical-align: middle; margin-right: 10px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>