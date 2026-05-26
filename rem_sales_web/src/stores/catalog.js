import { defineStore } from 'pinia'
import axios from 'axios'

/**
 * CATALOG STORE
 * Gestion de l'inventaire et du catalogue produits.
 */
export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    products: [],
    loading: false,
    error: null
  }),

  getters: {
    /**
     * Filtre les produits en rupture de stock.
     */
    outOfStockProducts: (state) => {
      if (!Array.isArray(state.products)) return []
      
      return state.products.filter(p => {
        const quantity = parseFloat(p.stock_quantity || p.stockQuantity || 0)
        return quantity <= 0
      })
    }
  },

  actions: {
    /**
     * Récupération du catalogue produits par entreprise.
     */
    async fetchProducts() {
      this.loading = true
      this.error = null
      
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL
        const companyId = localStorage.getItem('companyId')
        const token = localStorage.getItem('token')

        if (!companyId || !token) {
          throw new Error("Authentification invalide : Données manquantes.")
        }

        const response = await axios.get(`${baseUrl}/products`, {
          params: { company_id: companyId },
          headers: { Authorization: `Bearer ${token}` }
        })

        const rawData = response.data
        this.products = Array.isArray(rawData) ? rawData : (rawData?.products || [])

      } catch (err) {
        console.error('Catalog Store Error:', err)
        this.error = err.response?.data?.message || "Impossible de charger le catalogue."
        this.products = []
      } finally {
        this.loading = false
      }
    }
  }
})