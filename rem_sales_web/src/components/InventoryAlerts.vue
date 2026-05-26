<template>
  <div class="inventory-container">
    <h2 class="section-title">État des stocks critiques</h2>

    <div v-if="catalogStore.loading" class="state-message">
      Synchronisation des stocks en cours...
    </div>

    <div v-else-if="catalogStore.error" class="state-message error">
      {{ catalogStore.error }}
      <button @click="catalogStore.fetchProducts" class="btn-retry">Réessayer</button>
    </div>

    <div v-else class="alerts-grid">
      
      <div class="alert-card rupture">
        <h3>Rupture totale ({{ catalogStore.outOfStockProducts.length }})</h3>
        <ul>
          <li v-for="product in catalogStore.outOfStockProducts" :key="product.id">
            <span class="prod-name">{{ product.name }}</span>
            <span class="badge badge-red">0 en stock</span>
          </li>
          <li v-if="catalogStore.outOfStockProducts.length === 0" class="no-alert">
            Aucune rupture à signaler.
          </li>
        </ul>
      </div>

      <div class="alert-card warning">
        <h3>Seuil critique ({{ lowStockProducts.length }})</h3>
        <ul>
          <li v-for="product in lowStockProducts" :key="product.id">
            <span class="prod-name">{{ product.name }}</span>
            <span class="badge badge-orange">Stock : {{ product.stock_quantity ?? product.stockQuantity }}</span>
          </li>
          <li v-if="lowStockProducts.length === 0" class="no-alert">
            Niveaux de stocks conformes.
          </li>
        </ul>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useCatalogStore } from '../stores/catalog'

const catalogStore = useCatalogStore()

// Calcul des produits sous seuil d'alerte
const lowStockProducts = computed(() => {
  return catalogStore.products.filter(p => {
    const qty = parseFloat(p.stock_quantity || p.stockQuantity || 0)
    const alert = parseFloat(p.minStockAlert || 5)
    return qty > 0 && qty <= alert
  })
})

onMounted(() => {
  if (catalogStore.products.length === 0) {
    catalogStore.fetchProducts()
  }
})
</script>

<style scoped>
.inventory-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  font-family: 'ABeeZee', sans-serif;
}

.section-title {
  font-size: 1.2rem;
  margin-bottom: 25px;
  color: #000;
}

.alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.alert-card {
  background: #f9f9f9;
  border-radius: 6px;
  padding: 20px;
  border: 1px solid #eee;
}

.alert-card h3 { font-size: 0.9rem; margin-bottom: 15px; text-transform: uppercase; color: #666; }

ul { list-style: none; padding: 0; }
li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}

.prod-name { font-weight: 600; }
.badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
.badge-red { background-color: #ffebee; color: #c62828; }
.badge-orange { background-color: #fff3e0; color: #ef6c00; }

.no-alert { color: #2e7d32; font-style: italic; border: none; }
.state-message { text-align: center; padding: 40px; color: #666; }
.error { color: #c62828; }
.btn-retry { margin-top: 10px; background: #000; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
</style>