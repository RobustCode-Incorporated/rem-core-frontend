import { defineStore } from 'pinia'
import axios from 'axios'

export const useSalesStore = defineStore('sales', {
  state: () => ({
    sales: [],
    productAnalytics: [], // 👈 Nouveau state pour les données du donut
    loading: false,
    loadingAnalytics: false,
    error: null
  }),

  actions: {
    async fetchSales() {
      this.loading = true
      this.error = null
      try {
        const token = localStorage.getItem('token')
        const companyId = localStorage.getItem('companyId') || '943e411e-9c4c-484f-9dde-9db708f5159a'

        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/sales/documents`, {
          params: { company_id: companyId },
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          this.sales = response.data.data
        } else if (Array.isArray(response.data)) {
          this.sales = response.data
        } else {
          this.sales = []
        }

        console.log("🚀 [PINIA SUCCESS] Ventes injectées :", this.sales.length)
      } catch (err) {
        console.error("❌ [PINIA ERROR] Échec fetchSales :", err)
        this.error = err.message || "Impossible de charger les ventes."
      } finally {
        this.loading = false
      }
    },

    // ⚡ NOUVELLE ACTION POUR LE DONUT PRODUIT
    async fetchProductAnalytics(companyId) {
      this.loadingAnalytics = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/analytics/products`, {
          params: { company_id: companyId },
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.data && response.data.success) {
          this.productAnalytics = response.data.data
        }
      } catch (err) {
        console.error("❌ [PINIA ERROR] Échec fetchProductAnalytics :", err)
      } finally {
        this.loadingAnalytics = false
      }
    },

    async collectPayment(documentId) {
      try {
        const token = localStorage.getItem('token')
        const companyId = localStorage.getItem('companyId') || '943e411e-9c4c-484f-9dde-9db708f5159a'
        const response = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/sales/documents/${documentId}`,
          { status: 'PAID', company_id: companyId },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        return response.data
      } catch (err) {
        console.error("❌ [PINIA ERROR] Échec encaissement :", err)
        throw err
      }
    },

    async cancelInvoice(documentId) {
      try {
        const token = localStorage.getItem('token')
        const companyId = localStorage.getItem('companyId') || '943e411e-9c4c-484f-9dde-9db708f5159a'
        const response = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/sales/documents/${documentId}`,
          { status: 'CANCELLED', company_id: companyId },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        return response.data
      } catch (err) {
        console.error("❌ [PINIA ERROR] Échec annulation :", err)
        throw err
      }
    }
  }
})