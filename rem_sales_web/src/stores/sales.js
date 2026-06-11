import { defineStore } from 'pinia'
import axios from 'axios'

export const useSalesStore = defineStore('sales', {
  state: () => ({
    sales: [],
    loading: false,
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
        } else if (response.data && Array.isArray(response.data.documents)) {
          this.sales = response.data.documents
        } else if (response.data && Array.isArray(response.data.sales)) {
          this.sales = response.data.sales
        } else {
          this.sales = []
        }

        console.log("🚀 [PINIA SUCCESS] Ventes injectées dans le store :", this.sales.length, "documents chargés.")
      } catch (err) {
        console.error("❌ [PINIA ERROR] Échec de la synchronisation des ventes :", err)
        this.error = err.message || "Impossible de charger les ventes."
      } finally {
        this.loading = false
      }
    },

    // 💵 ACTION POUR CHANGER LE STATUT À "PAID"
    async collectPayment(documentId) {
      try {
        const token = localStorage.getItem('token')
        const companyId = localStorage.getItem('companyId') || '943e411e-9c4c-484f-9dde-9db708f5159a'

        const response = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/sales/documents/${documentId}`,
          { 
            status: 'PAID',
            company_id: companyId // 👈 Injecté dans le body pour pallier le token vide
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        return response.data
      } catch (err) {
        console.error("❌ [PINIA ERROR] Échec lors de l'encaissement :", err)
        throw err
      }
    },

    // ❌ ACTION POUR CHANGER LE STATUT À "CANCELLED"
    async cancelInvoice(documentId) {
      try {
        const token = localStorage.getItem('token')
        const companyId = localStorage.getItem('companyId') || '943e411e-9c4c-484f-9dde-9db708f5159a'

        const response = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/sales/documents/${documentId}`,
          { 
            status: 'CANCELLED',
            company_id: companyId // 👈 Injecté dans le body pour pallier le token vide
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        return response.data
      } catch (err) {
        console.error("❌ [PINIA ERROR] Échec lors de l'annulation :", err)
        throw err
      }
    }
  }
})