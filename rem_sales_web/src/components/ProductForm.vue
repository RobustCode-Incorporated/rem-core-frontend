<template>
  <div class="form-container">
    <div class="form-header">
      <h2>{{ $t('product.addTitle') }}</h2>
      <p>{{ $t('product.addSubtitle') }}</p>
    </div>

    <div v-if="isSuccess" class="banner success">{{ $t('product.saveSuccess') }}</div>
    <div v-if="errorMessage" class="banner error">{{ errorMessage }}</div>

    <form @submit.prevent="handleSubmit" class="product-form">
      <div class="form-group">
        <label for="name">{{ $t('product.nameLabel') }}</label>
        <input id="name" v-model="form.name" type="text" :placeholder="$t('product.namePlaceholder')" required />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="purchasePrice">{{ $t('product.purchasePrice') }}</label>
          <input id="purchasePrice" v-model.number="form.purchasePrice" type="number" step="0.01" placeholder="0.00" min="0" required />
        </div>
        <div class="form-group">
          <label for="sellingPrice">{{ $t('product.sellingPrice') }}</label>
          <input id="sellingPrice" v-model.number="form.sellingPrice" type="number" step="0.01" placeholder="0.00" min="1" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="stock">{{ $t('product.initialQty') }}</label>
          <input id="stock" v-model.number="form.stockQuantity" type="number" :placeholder="$t('product.qtyPlaceholder')" min="0" required />
        </div>
        <div class="form-group">
          <label for="currency">{{ $t('product.currency') }}</label>
          <select id="currency" v-model="form.currency">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="CDF">CDF (FC)</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="alert">{{ $t('product.alertThreshold') }}</label>
        <input id="alert" v-model.number="form.minStockAlert" type="number" min="1" required />
      </div>

      <button type="submit" :disabled="catalogStore.loading" class="btn-submit">
        {{ catalogStore.loading ? $t('product.submitLoading') : $t('product.submit') }}
      </button>
    </form>

    <hr class="divider" />
    <div class="list-section">
      <h3>{{ $t('product.catalogTitle') }}</h3>
      <div class="table-scroll">
        <table class="product-table">
          <thead>
            <tr>
              <th>{{ $t('product.colName') }}</th>
              <th>{{ $t('product.colStock') }}</th>
              <th>{{ $t('product.colPurchase') }}</th>
              <th>{{ $t('product.colSale') }}</th>
              <th>{{ $t('product.colCurrency') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in catalogStore.products" :key="product.id">
              <td class="prod-name">{{ product.name }}</td>
              <td>{{ product.stock_quantity }}</td>
              <td>{{ product.purchase_price }}</td>
              <td>{{ product.selling_price }}</td>
              <td><span class="currency-tag">{{ product.currency }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCatalogStore } from '../stores/catalog'

const catalogStore = useCatalogStore()
const { t } = useI18n()

const initialFormState = {
  name: '',
  purchasePrice: null,
  sellingPrice: null,
  stockQuantity: null,
  minStockAlert: 5,
  currency: 'USD'
}

const form = ref({ ...initialFormState })
const isSuccess = ref(false)
const errorMessage = ref('')

onMounted(() => {
  catalogStore.fetchProducts()
})

const handleSubmit = async () => {
  errorMessage.value = ''
  isSuccess.value = false

  // Correction cruciale : Le store doit utiliser une URL robuste
  const success = await catalogStore.saveProduct(form.value)

  if (success) {
    isSuccess.value = true
    form.value = { ...initialFormState }
    setTimeout(() => { isSuccess.value = false }, 3000)
  } else {
    errorMessage.value = catalogStore.error || t('product.saveError')
  }
}
</script>

<style scoped>
/* Tes styles restent inchangés */
.form-container { background: white; padding: 40px; border-radius: 8px; max-width: 700px; margin: 0 auto; font-family: 'ABeeZee', sans-serif; }
.form-header { margin-bottom: 30px; }
.product-form { display: flex; flex-direction: column; gap: 20px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
label { font-size: 0.85rem; font-weight: 600; color: #333; display: block; margin-bottom: 8px; }
input, select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
.divider { border: 0; border-top: 1px solid #eee; margin: 40px 0; }
.product-table { width: 100%; border-collapse: collapse; }
.product-table th, .product-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; font-size: 0.9rem; }
.currency-tag { font-size: 0.75rem; color: #000; font-weight: bold; background: #e0e0e0; padding: 4px 8px; border-radius: 4px; }
.btn-submit { background: #000; color: #fff; border: none; padding: 15px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 10px; }
.banner { padding: 12px; margin-bottom: 20px; border-radius: 6px; font-weight: 600; }
.success { background: #e8f5e9; color: #2e7d32; }
.error { background: #ffebee; color: #c62828; }
.table-scroll { overflow-x: auto; }
.product-table { min-width: 560px; }

@media (max-width: 768px) {
  .form-container {
    padding: 16px;
  }
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>