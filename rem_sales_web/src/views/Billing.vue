<template>
  <div class="billing-container">
    <h2 class="main-title">Choisissez le moteur de votre PME</h2>
    
    <div v-if="errorMessage" class="error-banner">
      <span>⚠️ {{ errorMessage }}</span>
    </div>

    <div class="plans-grid">
      <div class="plan-card" :class="{ 'disabled-card': activeLoadingId && activeLoadingId !== 'price_1TibG6JLHjLUPZfxYZfpGu8B' }">
        <h3>Entrée</h3>
        <p class="price">29€ <span>/ mois</span></p>
        <ul>
          <li>Jusqu'à 3 revendeurs</li>
          <li>Tableau de bord essentiel</li>
          <li>Essai gratuit de 30 jours</li>
        </ul>
        <button 
          @click="handleSubscription('price_1TibG6JLHjLUPZfxYZfpGu8B')" 
          :disabled="activeLoadingId !== null"
          class="btn-plan"
        >
          {{ activeLoadingId === 'price_1TibG6JLHjLUPZfxYZfpGu8B' ? 'Connexion Stripe...' : 'Sélectionner' }}
        </button>
      </div>

      <div class="plan-card featured" :class="{ 'disabled-card': activeLoadingId && activeLoadingId !== 'price_1TibLcJLHjLUPZfxOz4622dR' }">
        <div class="pop-badge">RECOMMANDÉ</div>
        <h3>Standard</h3>
        <p class="price">59€ <span>/ mois</span></p>
        <ul>
          <li>Jusqu'à 10 revendeurs</li>
          <li>Analyses graphiques de base</li>
          <li>Essai gratuit de 30 jours</li>
        </ul>
        <button 
          @click="handleSubscription('price_1TibLcJLHjLUPZfxOz4622dR')" 
          :disabled="activeLoadingId !== null"
          class="btn-plan"
        >
          {{ activeLoadingId === 'price_1TibLcJLHjLUPZfxOz4622dR' ? 'Connexion Stripe...' : 'Sélectionner' }}
        </button>
      </div>

      <div class="plan-card" :class="{ 'disabled-card': activeLoadingId && activeLoadingId !== 'price_1TibOoJLHjLUPZfxUmFSbuvL' }">
        <h3>Professionnel</h3>
        <p class="price">99€ <span>/ mois</span></p>
        <ul>
          <li>Revendeurs illimités</li>
          <li>Donuts & KPI avancés</li>
          <li>Essai gratuit de 30 jours</li>
        </ul>
        <button 
          @click="handleSubscription('price_1TibOoJLHjLUPZfxUmFSbuvL')" 
          :disabled="activeLoadingId !== null"
          class="btn-plan"
        >
          {{ activeLoadingId === 'price_1TibOoJLHjLUPZfxUmFSbuvL' ? 'Connexion Stripe...' : 'Sélectionner' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'express' // Remplacer par ton instance axios globale si nécessaire

// États réactifs pour l'expérience utilisateur
const activeLoadingId = ref(null)
const errorMessage = ref('')

const handleSubscription = async (priceId) => {
  activeLoadingId.value = priceId
  errorMessage.value = ''
  
  try {
    const token = localStorage.getItem('token')
    
    // Correction de l'endpoint pour cibler la route exacte de ton app.ts actualisé
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/stripe/checkout`,
      { planPriceId: priceId },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    // Si Stripe renvoie l'URL de sa session de paiement, on redirige l'utilisateur
    if (response.data.url) {
      window.location.href = response.data.url
    } else {
      throw new Error("L'API de paiement n'a renvoyé aucune URL valide.")
    }
  } catch (err) {
    // Extraction propre du message d'erreur envoyé par ton Express backend
    errorMessage.value = err.response?.data?.error || "Impossible d'initier la session de paiement avec Stripe. Veuillez réessayer."
    activeLoadingId.value = null
  }
}
</script>

<style scoped>
.billing-container { padding: 50px 20px; text-align: center; font-family: 'ABeeZee', sans-serif; background: #FFFAFA; min-height: 100vh; }
.main-title { font-family: 'Ysabeau Office', sans-serif; font-size: 2.5rem; margin-bottom: 20px; color: #000; }

/* Bannière d'erreur moderne */
.error-banner { max-width: 600px; margin: 0 auto 30px auto; background-color: #ffebee; border: 1px solid #ffcdd2; color: #c62828; padding: 12px 20px; border-radius: 8px; font-weight: bold; font-size: 0.9rem; text-align: left; animation: fadeIn 0.3s ease-in-out; }

.plans-grid { display: flex; gap: 30px; justify-content: center; max-width: 1200px; margin: 0 auto; flex-wrap: wrap; padding-top: 20px; }
.plan-card { background: #fff; border: 1px solid #ddd; padding: 30px; border-radius: 12px; width: 300px; text-align: left; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: all 0.3s ease; }

/* Mise en avant du plan Standard */
.plan-card.featured { background: #000; color: #fff; border-color: #000; transform: scale(1.05); box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.pop-badge { position: absolute; top: -15px; right: 20px; background: #fffa00; color: #000; font-weight: bold; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }

/* Effet visuel si une autre carte charge */
.disabled-card { opacity: 0.5; transform: scale(0.98); pointer-events: none; }

.price { font-size: 2.2rem; font-weight: bold; margin: 20px 0; }
.price span { font-size: 1rem; color: #707070; font-weight: normal; }
.plan-card.featured .price span { color: #ccc; }

ul { list-style: none; padding: 0; margin-bottom: 30px; }
ul li { margin-bottom: 12px; font-size: 0.95rem; display: flex; align-items: center; }
ul li::before { content: "✓"; margin-right: 8px; color: #2e7d32; font-weight: bold; }
.plan-card.featured ul li::before { color: #fffa00; }

button.btn-plan { width: 100%; padding: 14px; background: #000; color: #fff; border: 1px solid #000; font-weight: bold; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; font-size: 0.95rem; }
button.btn-plan:hover { background: #333; border-color: #333; }
button.btn-plan:disabled { background: #ccc; border-color: #ccc; color: #666; cursor: not-allowed; }

.plan-card.featured button.btn-plan { background: #fff; color: #000; border-color: #fff; }
.plan-card.featured button.btn-plan:hover { background: #e0e0e0; border-color: #e0e0e0; }
.plan-card.featured button.btn-plan:disabled { background: #555; border-color: #555; color: #888; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>