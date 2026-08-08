<template>
  <div class="pos-container">
    <header class="module-header">
      <h2>{{ $t('orderModule.title') }}</h2>
      <p>{{ $t('orderModule.subtitle') }}</p>
    </header>

    <div class="form-grid">
      <div class="form-group full-width">
        <label>{{ $t('orderModule.clientNameLabel') }}</label>
        <input 
          v-model="clientForm.name" 
          type="text" 
          :placeholder="$t('orderModule.clientNamePlaceholder')" 
          class="form-input" 
          required
        />
      </div>

      <div class="form-group">
        <label>{{ $t('orderModule.phoneLabel') }}</label>
        <input 
          v-model="clientForm.phone" 
          type="text" 
          :placeholder="$t('orderModule.phonePlaceholder')" 
          class="form-input" 
        />
      </div>

      <div class="form-group">
        <label>{{ $t('orderModule.emailLabel') }}</label>
        <input 
          v-model="clientForm.email" 
          type="email" 
          :placeholder="$t('orderModule.emailPlaceholder')" 
          class="form-input" 
        />
      </div>

      <div class="form-group full-width">
        <label>{{ $t('orderModule.addressLabel') }}</label>
        <textarea 
          v-model="clientForm.address" 
          :placeholder="$t('orderModule.addressPlaceholder')" 
          class="form-input form-textarea"
          rows="2"
        ></textarea>
      </div>

      <div class="form-group">
        <label>{{ $t('orderModule.productLabel') }}</label>
        <select v-model="selectedProduct" class="form-input animate-select" required>
          <option :value="null" disabled>{{ $t('orderModule.productPlaceholder') }}</option>
          <option v-for="p in catalogStore.products" :key="p.id" :value="p">
            {{ p.name }} - {{ p.selling_price }} {{ p.currency }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>{{ $t('orderModule.qtyLabel') }}</label>
        <input 
          v-model.number="quantity" 
          type="number" 
          min="1" 
          class="form-input" 
          required
        />
      </div>
    </div>

    <button 
      @click="processSale" 
      :disabled="loading" 
      class="btn-primary"
    >
      {{ loading ? $t('orderModule.processing') : $t('orderModule.submit') }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCatalogStore } from '../stores/catalog'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

const { t } = useI18n()
const catalogStore = useCatalogStore()
const selectedProduct = ref(null)
const quantity = ref(1)
const loading = ref(false)

// Formulaire client complet calqué sur ta structure SQL
const clientForm = ref({
  name: '',
  phone: '',
  email: '',
  address: ''
})

onMounted(() => {
  catalogStore.fetchProducts()
})

const processSale = async () => {
  if (!clientForm.value.name || clientForm.value.name.trim() === '') {
    return alert(t('orderModule.errorNameRequired'))
  }

  if (!selectedProduct.value) {
    return alert(t('orderModule.errorProductRequired'))
  }
  
  if (quantity.value < 1) {
    return alert(t('orderModule.errorQtyMin'))
  }
  
  loading.value = true
  
  try {
    const token = localStorage.getItem('token')
    const companyId = localStorage.getItem('companyId')

    // 1. Création du client avec TOUTES les données fournies
    const clientResponse = await axios.post(
      `${import.meta.env.VITE_API_URL}/sales/clients`, 
      {
        name: clientForm.value.name,
        phone: clientForm.value.phone || null,
        email: clientForm.value.email || null,
        address: clientForm.value.address || null,
        company_id: companyId
      }, 
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    
    const clientId = clientResponse.data.client.id

    // 2. Structuration du document commercial
    const saleData = {
      id: crypto.randomUUID(),
      clientId: clientId,
      type: 'INVOICE',
      number: 'INV-' + Date.now().toString().slice(-6),
      status: 'PAID', // Enclenche la déduction automatique des stocks au backend
      totalAmount: selectedProduct.value.selling_price * quantity.value,
      company_id: companyId,
      items: [{
        productId: selectedProduct.value.id,
        quantity: quantity.value,
        unitPrice: selectedProduct.value.selling_price,
        lineTotal: selectedProduct.value.selling_price * quantity.value
      }]
    }

    // 3. Validation finale de la vente
    await axios.post(
      `${import.meta.env.VITE_API_URL}/sales/documents`, 
      saleData, 
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    
    alert(t('orderModule.successMessage', { name: clientForm.value.name }))
    
    // Réinitialisation complète du module après succès
    clientForm.value = { name: '', phone: '', email: '', address: '' }
    selectedProduct.value = null
    quantity.value = 1
    
  } catch (err) {
    console.error("Erreur vente:", err)
    alert(t('orderModule.errorGeneric') + (err.response?.data?.error || err.message))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pos-container { 
  max-width: 550px; 
  margin: 0 auto; 
  background: #fff; 
  padding: 30px; 
  border-radius: 12px; 
  border: 1px solid #eee;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.module-header { margin-bottom: 25px; border-bottom: 1px solid #fafafa; padding-bottom: 10px; }
.module-header h2 { margin: 0; font-size: 1.6rem; font-weight: 700; color: #111; }
.module-header p { color: #666; font-size: 0.9rem; margin-top: 5px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.full-width { grid-column: 1 / span 2; }

label { font-size: 0.85rem; font-weight: 600; color: #444; text-transform: uppercase; letter-spacing: 0.5px; }

.form-input { 
  padding: 12px; 
  border: 1px solid #ccc; 
  border-radius: 6px; 
  font-size: 0.95rem;
  transition: border-color 0.2s;
  background-color: #fcfcfc;
}

.form-input:focus {
  border-color: #000;
  background-color: #fff;
  outline: none;
}

.form-textarea { resize: vertical; font-family: inherit; }

.animate-select { cursor: pointer; }

.btn-primary { 
  width: 100%; 
  padding: 16px; 
  background: #000; 
  color: #fff; 
  border: none; 
  border-radius: 6px; 
  cursor: pointer; 
  font-weight: 700; 
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: background 0.2s, transform 0.1s;
}

.btn-primary:disabled { background: #666; cursor: not-allowed; }
.btn-primary:hover:not(:disabled) { background: #222; }
.btn-primary:active:not(:disabled) { transform: scale(0.99); }
</style>