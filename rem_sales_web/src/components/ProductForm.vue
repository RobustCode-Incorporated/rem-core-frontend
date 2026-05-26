<template>
  <div class="form-container">
    <div class="form-header">
      <h2>Ajouter un nouvel article</h2>
      <p>Configurez les détails du produit pour le rendre disponible dans le catalogue.</p>
    </div>

    <div v-if="isSuccess" class="banner success">
      Produit enregistré avec succès.
    </div>
    
    <div v-if="errorMessage" class="banner error">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleSubmit" class="product-form">
      <div class="form-group">
        <label for="name">Désignation de l'article</label>
        <input 
          id="name" 
          v-model="form.name" 
          type="text" 
          placeholder="Ex: Sac de Ciment 50kg" 
          required
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="price">Prix de vente unitaire</label>
          <input 
            id="price" 
            v-model.number="form.sellingPrice" 
            type="number" 
            placeholder="0" 
            min="1"
            required
          />
        </div>

        <div class="form-group">
          <label for="stock">Quantité initiale</label>
          <input 
            id="stock" 
            v-model.number="form.stockQuantity" 
            type="number" 
            placeholder="Ex: 100" 
            min="0"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="alert">Seuil d'alerte stock</label>
        <input 
          id="alert" 
          v-model.number="form.minStockAlert" 
          type="number" 
          min="1"
          required
        />
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="catalogStore.loading" class="btn-submit">
          {{ catalogStore.loading ? 'Enregistrement en cours...' : 'Sauvegarder le produit' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCatalogStore } from '../stores/catalog'

const catalogStore = useCatalogStore()

const initialFormState = {
  name: '',
  sellingPrice: null,
  stockQuantity: null,
  minStockAlert: 5
}

const form = ref({ ...initialFormState })
const isSuccess = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''
  isSuccess.value = false

  if (!form.value.name || form.value.sellingPrice <= 0 || form.value.stockQuantity < 0) {
    errorMessage.value = 'Veuillez remplir correctement tous les champs.'
    return
  }

  const success = await catalogStore.saveProduct(form.value)

  if (success) {
    isSuccess.value = true
    form.value = { ...initialFormState }
    setTimeout(() => { isSuccess.value = false }, 3000)
  } else {
    errorMessage.value = catalogStore.error || "Une erreur est survenue."
  }
}
</script>

<style scoped>
.form-container {
  background: white;
  padding: 40px;
  border-radius: 8px;
  max-width: 600px;
  margin: 0 auto;
  font-family: 'ABeeZee', sans-serif;
}

.form-header { margin-bottom: 30px; }
.form-header h2 { font-size: 1.5rem; color: #000; margin-bottom: 8px; }
.form-header p { color: #666; font-size: 0.9rem; }

.product-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

label { font-size: 0.85rem; font-weight: 600; color: #333; }
input { padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.95rem; }

.banner { padding: 12px; border-radius: 6px; font-size: 0.9rem; font-weight: 600; margin-bottom: 20px; }
.success { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
.error { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }

.btn-submit {
  background: #000;
  color: #fff;
  border: none;
  padding: 15px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
}

.btn-submit:disabled { background: #333; cursor: not-allowed; }
</style>