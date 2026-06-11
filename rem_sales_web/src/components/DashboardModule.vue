<template>
  <div class="restock-container">
    <div class="header-section">
      <h2>Mon Inventaire & Réapprovisionnement</h2>
      <button @click="fetchStocks" class="refresh-btn">Actualiser</button>
    </div>
    
    <div v-if="loading" class="loader">Chargement...</div>

    <table v-else class="stock-table">
      <thead>
        <tr>
          <th>Produit</th>
          <th>Stock Actuel</th>
          <th>Seuil Critique</th>
          <th>Commander</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in stocks" :key="item.product_id">
          <td>{{ item.product_name }}</td>
          <td :class="{'critical': item.quantity <= item.min_threshold}">
            {{ item.quantity }}
          </td>
          <td>{{ item.min_threshold }}</td>
          <td>
            <input 
              type="number" 
              v-model.number="orderQtys[item.product_id]" 
              placeholder="0" 
              class="qty-input"
              min="0"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <button 
      @click="submitRestock" 
      class="btn-order" 
      :disabled="isSubmitting"
    >
      {{ isSubmitting ? 'Envoi...' : 'Passer la commande' }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const stocks = ref([]);
const orderQtys = ref({});
const loading = ref(false);
const isSubmitting = ref(false);

// 1. Charger les stocks
const fetchStocks = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/resellers/my-stock`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    stocks.value = res.data.data;
  } catch (err) { 
    console.error("Erreur chargement stock", err);
    alert("Impossible de charger l'inventaire.");
  } finally {
    loading.value = false;
  }
};

// 2. Soumettre la commande
const submitRestock = async () => {
  const items = Object.entries(orderQtys.value)
    .filter(([_, qty]) => qty > 0)
    .map(([product_id, quantity]) => ({ product_id, quantity }));

  if (items.length === 0) return alert("Veuillez saisir une quantité pour au moins un produit.");

  isSubmitting.value = true;
  try {
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/resellers/restock-request`, 
      { items },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    
    alert("Demande de réapprovisionnement transmise avec succès !");
    orderQtys.value = {}; // Reset du formulaire
    fetchStocks();       // Recharger les données
  } catch (err) { 
    console.error(err);
    alert("Échec de l'envoi de la commande."); 
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(fetchStocks);
</script>

<style scoped>
.restock-container { padding: 30px; background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.header-section { display: flex; justify-content: space-between; align-items: center; }
.stock-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
.stock-table th { text-align: left; color: #666; padding: 15px; border-bottom: 2px solid #eee; }
.stock-table td { padding: 15px; border-bottom: 1px solid #eee; }
.critical { color: #d9534f; font-weight: bold; }
.qty-input { width: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
.btn-order { margin-top: 25px; padding: 12px 25px; background: #000; color: #fff; border: none; border-radius: 6px; cursor: pointer; transition: 0.3s; }
.btn-order:disabled { background: #ccc; cursor: not-allowed; }
.btn-order:hover:not(:disabled) { background: #333; }
.refresh-btn { background: #f0f0f0; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer; }
</style>