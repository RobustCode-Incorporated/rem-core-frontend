import { defineStore } from 'pinia'
import axios from 'axios'

/**
 * SALES STORE
 * Gestion des documents commerciaux et réconciliation financière.
 */
export const useSalesStore = defineStore('sales', {
  state: () => ({
    documents: [], 
    loading: false,
    error: null
  }),

  getters: {
    /**
     * Réconciliation financière en temps réel.
     * Analyse des totaux par devise.
     */
    totalsByCurrency: (state) => {
      if (!Array.isArray(state.documents)) return {}

      return state.documents.reduce((acc, doc) => {
        const currency = doc.currency || 'XOF'
        const amount = parseFloat(doc.total_amount || doc.totalAmount || 0)

        if (!acc[currency]) {
          acc[currency] = { total: 0, count: 0, paid: 0, draft: 0 }
        }

        acc[currency].total += amount
        acc[currency].count += 1
        
        if (doc.status === 'PAID') acc[currency].paid += amount
        else if (doc.status === 'DRAFT') acc[currency].draft += amount

        return acc
      }, {})
    }
  },

  actions: {
    /**
     * Récupération des données multi-tenant.
     * Utilisation de l'ID entreprise et du jeton d'authentification.
     */
    async fetchSalesDocuments() {
      this.loading = true
      this.error = null
      
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL
        const companyId = localStorage.getItem('companyId')
        const token = localStorage.getItem('token')

        if (!companyId || !token) {
          throw new Error("Authentification invalide : Données manquantes.")
        }

        const response = await axios.get(`${baseUrl}/sales`, {
          params: { company_id: companyId },
          headers: { Authorization: `Bearer ${token}` }
        })

        const rawData = response.data
        this.documents = Array.isArray(rawData) ? rawData : (rawData?.documents || [])

      } catch (err) {
        console.error('Sales Store Error:', err)
        this.error = err.response?.data?.message || "Impossible de synchroniser les ventes."
        this.documents = [] 
      } finally {
        this.loading = false
      }
    }
  }
})