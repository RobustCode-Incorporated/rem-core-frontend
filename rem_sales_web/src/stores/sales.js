import { defineStore } from 'pinia'
import axios from 'axios'

export const useSalesStore = defineStore('sales', {
  state: () => ({
    // 🛡️ On s'assure que c'est un tableau vide par défaut
    documents: [], 
    loading: false,
    error: null
  }),

  getters: {
    // 📊 Calcul des totaux par devise pour le tableau de bord
    totalsByCurrency: (state) => {
      const totals = {}
      
      // 🛡️ SÉCURITÉ SENIOR DEV : Si pour une raison X, state.documents n'est pas un tableau, 
      // on esquive le crash de l'application en renvoyant un objet vide
      if (!state.documents || !Array.isArray(state.documents)) {
        return totals
      }

      state.documents.forEach((doc) => {
        // Support adaptatif : gère 'FCFA', 'XOF', 'USD' etc. 
        // Si ta table n'a pas de colonne currency, on fallback sur 'XOF' par défaut
        const currency = doc.currency || 'XOF' 
        const amount = Number(doc.total_amount || doc.totalAmount || 0)

        if (!totals[currency]) {
          totals[currency] = { total: 0, count: 0, paid: 0, draft: 0 }
        }

        totals[currency].total += amount
        totals[currency].count += 1
        
        if (doc.status === 'PAID') {
          totals[currency].paid += amount
        } else if (doc.status === 'DRAFT') {
          totals[currency].draft += amount
        }
      })

      return totals
    }
  },

  actions: {
    async fetchSalesDocuments() {
      this.loading = true
      this.error = null
      
      try {
        // On récupère l'adresse de base configurée dans ton .env de Codespaces
        const baseUrl = import.meta.env.VITE_API_BASE_URL
        const companyId = 'robust-corp-africa-123' // Multi-tenant ID simulé du manager

        const response = await axios.get(`${baseUrl}/sales`, {
          params: { company_id: companyId }
        })

        // 🛡️ CORRECTION MAJEURE : On s'assure d'extraire le tableau de données proprement.
        // Si le backend renvoie directement le tableau ou un objet { data: [...] }
        if (Array.isArray(response.data)) {
          this.documents = response.data
        } else if (response.data && Array.isArray(response.data.documents)) {
          this.documents = response.data.documents
        } else {
          console.warn("⚠️ [Sales Store] Format inattendu du backend :", response.data)
          this.documents = []
        }

      } catch (err) {
        console.error('⚡ [Sales Store Error]:', err)
        this.error = err.message || 'Impossible de charger le suivi des ventes.'
        this.documents = [] // Évite de laisser un état corrompu en cas d'échec
      } finally {
        this.loading = false
      }
    }
  }
})