<template>
  <div class="reconciliation-container">
    <div class="header-actions">
      <h2>Suivi des ventes</h2>
      <button @click="salesStore.fetchSalesDocuments" class="btn-refresh">
        Actualiser
      </button>
    </div>

    <div class="kpi-grid" v-if="!salesStore.loading">
      <div v-for="(data, currency) in salesStore.totalsByCurrency" :key="currency" class="kpi-card">
        <span class="kpi-label">Total encaissé ({{ currency }})</span>
        <span class="kpi-value">{{ data.paid.toLocaleString() }} {{ currency }}</span>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="sales-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Facture</th>
            <th>Type</th>
            <th>Total</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="salesStore.loading">
            <td colspan="5" class="text-center">Chargement des données...</td>
          </tr>

          <tr v-else-if="salesStore.error">
            <td colspan="5" class="text-center error-text">{{ salesStore.error }}</td>
          </tr>

          <tr v-else-if="salesStore.documents.length === 0">
            <td colspan="5" class="text-center">Aucune donnée disponible.</td>
          </tr>

          <tr v-for="doc in salesStore.documents" :key="doc.id">
            <td>{{ formatDate(doc.createdAt) }}</td>
            <td class="font-mono">{{ doc.number }}</td>
            <td>{{ doc.type }}</td>
            <td class="font-bold">{{ doc.totalAmount.toLocaleString() }} {{ doc.currency || 'XOF' }}</td>
            <td>
              <span :class="['status-pill', doc.status.toLowerCase()]">
                {{ doc.status === 'PAID' ? 'Encaissé' : 'En attente' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useSalesStore } from '../stores/sales'

const salesStore = useSalesStore()

onMounted(() => {
  salesStore.fetchSalesDocuments()
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}
</script>

<style scoped>
.reconciliation-container {
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  font-family: 'ABeeZee', sans-serif;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.btn-refresh {
  background: #000;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.kpi-card {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #eee;
}

.kpi-label { font-size: 0.75rem; color: #666; text-transform: uppercase; font-weight: bold; }
.kpi-value { display: block; font-size: 1.4rem; font-weight: bold; margin-top: 5px; }

.sales-table { width: 100%; border-collapse: collapse; text-align: left; }
.sales-table th { padding: 15px; border-bottom: 2px solid #eee; color: #666; }
.sales-table td { padding: 15px; border-bottom: 1px solid #eee; }

.font-mono { font-family: monospace; font-weight: bold; }
.font-bold { font-weight: bold; }
.text-center { text-align: center; padding: 40px; color: #999; }
.error-text { color: #d32f2f; }

.status-pill {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
}
.status-pill.paid { background: #e8f5e9; color: #2e7d32; }
.status-pill.draft { background: #fff3e0; color: #ef6c00; }
</style>