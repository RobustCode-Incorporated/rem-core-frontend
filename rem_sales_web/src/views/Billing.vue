<template>
  <div class="billing-container">
    <header class="billing-header">
      <img src="../assets/RobustCodelogowhite.png" alt="Logo REM" class="brand-logo" />
      <h1 class="main-title">Choisissez le moteur de votre PME</h1>
      <p class="subtitle">Des outils analytiques puissants pour propulser votre croissance. Facturation sécurisée par Stripe.</p>
    </header>
    
    <div v-if="errorMessage" class="error-banner">
      <span class="error-icon">⚠️</span> {{ errorMessage }}
    </div>

    <div class="billing-mode-selector">
      <button 
        type="button" 
        class="selector-btn"
        :class="{ active: !skipTrialMode }" 
        @click="skipTrialMode = false"
      >
        Option 1 : Essai gratuit 30 jours
      </button>
      <button 
        type="button" 
        class="selector-btn"
        :class="{ active: skipTrialMode }" 
        @click="skipTrialMode = true"
      >
        Option 2 : Paiement immédiat (Sans essai)
      </button>
    </div>

    <div class="plans-grid">
      <div class="plan-card" :class="{ 'disabled-card': activeLoadingId && activeLoadingId !== PLAN_IDS.ENTREE }">
        <div class="plan-header">
          <h3>Entrée</h3>
          <p class="plan-desc">L'essentiel pour démarrer</p>
        </div>
        <div class="price-container">
          <span class="currency">€</span>
          <span class="amount">29</span>
          <span class="period">/ mois</span>
        </div>
        <ul class="features-list">
          <li>Jusqu'à 3 revendeurs</li>
          <li>Tableau de bord essentiel</li>
          <li>Support par email</li>
          <li v-if="skipTrialMode" class="immediate-activation">Activation & Facturation immédiate</li>
          <li v-else>Essai gratuit de 30 jours</li>
        </ul>
        <button 
          @click="handleSubscription(PLAN_IDS.ENTREE)" 
          :disabled="activeLoadingId !== null"
          class="btn-plan base-btn"
        >
          <span v-if="activeLoadingId === PLAN_IDS.ENTREE" class="loader"></span>
          <span v-else>{{ skipTrialMode ? 'Payer et activer' : 'Sélectionner ce plan' }}</span>
        </button>
      </div>

      <div class="plan-card featured" :class="{ 'disabled-card': activeLoadingId && activeLoadingId !== PLAN_IDS.STANDARD }">
        <div class="pop-badge">⭐️ RECOMMANDÉ</div>
        <div class="plan-header">
          <h3>Standard</h3>
          <p class="plan-desc">Pour les PME en pleine expansion</p>
        </div>
        <div class="price-container">
          <span class="currency">€</span>
          <span class="amount">59</span>
          <span class="period">/ mois</span>
        </div>
        <ul class="features-list">
          <li>Jusqu'à 10 revendeurs</li>
          <li>Analyses graphiques de base</li>
          <li>Suivi du flux logistique</li>
          <li v-if="skipTrialMode" class="immediate-activation">Activation & Facturation immédiate</li>
          <li v-else>Essai gratuit de 30 jours</li>
        </ul>
        <button 
          @click="handleSubscription(PLAN_IDS.STANDARD)" 
          :disabled="activeLoadingId !== null"
          class="btn-plan featured-btn"
        >
          <span v-if="activeLoadingId === PLAN_IDS.STANDARD" class="loader loader-dark"></span>
          <span v-else>{{ skipTrialMode ? 'Payer et activer' : 'Sélectionner ce plan' }}</span>
        </button>
      </div>

      <div class="plan-card" :class="{ 'disabled-card': activeLoadingId && activeLoadingId !== PLAN_IDS.PRO }">
        <div class="plan-header">
          <h3>Professionnel</h3>
          <p class="plan-desc">Performance et contrôle total</p>
        </div>
        <div class="price-container">
          <span class="currency">€</span>
          <span class="amount">99</span>
          <span class="period">/ mois</span>
        </div>
        <ul class="features-list">
          <li>Revendeurs illimités</li>
          <li>Donuts & KPI avancés</li>
          <li>Cartographie multi-tenant</li>
          <li v-if="skipTrialMode" class="immediate-activation">Activation & Facturation immédiate</li>
          <li v-else>Essai gratuit de 30 jours</li>
        </ul>
        <button 
          @click="handleSubscription(PLAN_IDS.PRO)" 
          :disabled="activeLoadingId !== null"
          class="btn-plan base-btn"
        >
          <span v-if="activeLoadingId === PLAN_IDS.PRO" class="loader"></span>
          <span v-else>{{ skipTrialMode ? 'Payer et activer' : 'Sélectionner ce plan' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

// Centralisation des IDs Stripe
const PLAN_IDS = {
  ENTREE: 'price_1TibG6JLHjLUPZfxYZfpGu8B',
  STANDARD: 'price_1TibLcJLHjLUPZfxOz4622dR',
  PRO: 'price_1TibOoJLHjLUPZfxUmFSbuvL'
}

const activeLoadingId = ref(null)
const errorMessage = ref('')

// 🌟 État local réactif : Contrôle si on passe l'essai ou non
const skipTrialMode = ref(false)

const handleSubscription = async (priceId) => {
  activeLoadingId.value = priceId
  errorMessage.value = ''
  
  try {
    const token = localStorage.getItem('token')
    const targetUrl = `${import.meta.env.VITE_API_URL}/stripe/checkout`
    
    // ✨ On envoie la valeur exacte sélectionnée sur l'écran au backend
    const response = await axios.post(
      targetUrl,
      { 
        planPriceId: priceId,
        skipTrial: skipTrialMode.value 
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    if (response.data.url) {
      window.location.href = response.data.url
    } else {
      throw new Error("L'API de paiement n'a renvoyé aucune URL valide.")
    }
  } catch (err) {
    errorMessage.value = err.response?.data?.error || "Impossible d'initier la session de paiement avec Stripe. Veuillez réessayer."
    activeLoadingId.value = null
  }
}
</script>

<style scoped>
.billing-container { 
  padding: 60px 20px; 
  text-align: center; 
  font-family: 'ABeeZee', sans-serif; 
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0a0a0a 100%);
  color: #ffffff;
  min-height: 100vh; 
  display: flex;
  flex-direction: column;
  align-items: center;
}

.billing-header {
  margin-bottom: 35px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.brand-logo {
  width: 280px;
  max-width: 100%;
  margin-bottom: 24px;
  filter: drop-shadow(0px 4px 10px rgba(255, 255, 255, 0.1));
}

.main-title { 
  font-family: 'Ysabeau Office', sans-serif; 
  font-size: 2.8rem; 
  margin-bottom: 10px; 
  font-weight: 300;
  letter-spacing: 1px;
}

.subtitle {
  color: #a0a0a0;
  font-size: 1.1rem;
  max-width: 600px;
  line-height: 1.5;
}

/* 🌟 STYLE DU NOUVEAU SÉLECTEUR BOUTON (Design Minimaliste Noir & Blanc) */
.billing-mode-selector {
  display: inline-flex;
  flex-wrap: wrap;
  background-color: #1c1c1e;
  padding: 6px;
  border-radius: 30px;
  margin-bottom: 50px;
  border: 1px solid #333;
}

.selector-btn {
  background: transparent;
  border: none;
  color: #a0a0a0;
  padding: 10px 18px;
  font-size: 0.95rem;
  font-weight: bold;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.selector-btn:hover {
  color: #fff;
}

/* État actif : Style haut contraste Noir & Blanc pur */
.selector-btn.active {
  background-color: #ffffff;
  color: #000000;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

.error-banner { 
  max-width: 600px; 
  width: 100%;
  margin: 0 auto 40px auto; 
  background-color: rgba(220, 38, 38, 0.1); 
  border: 1px solid #dc2626; 
  color: #fca5a5; 
  padding: 16px 20px; 
  border-radius: 8px; 
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600; 
  font-size: 0.95rem; 
  text-align: left; 
  animation: fadeIn 0.4s ease-in-out; 
}

.plans-grid { 
  display: flex; 
  gap: 30px; 
  justify-content: center; 
  max-width: 1100px; 
  width: 100%;
  flex-wrap: wrap; 
}

.plan-card { 
  background: #1c1c1e; 
  border: 1px solid #333; 
  padding: 40px 30px; 
  border-radius: 16px; 
  width: 100%;
  max-width: 340px;
  text-align: left; 
  position: relative; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.5); 
  transition: transform 0.3s ease, border-color 0.3s ease; 
  display: flex;
  flex-direction: column;
}

.plan-card:hover {
  transform: translateY(-8px);
  border-color: #555;
}

.plan-card.featured { 
  background: linear-gradient(180deg, #2a2a2a 0%, #1c1c1e 100%);
  border: 1px solid #fffa00; 
  transform: scale(1.05); 
  box-shadow: 0 15px 40px rgba(255, 250, 0, 0.15); 
}

.plan-card.featured:hover {
  transform: scale(1.05) translateY(-8px);
}

.pop-badge { 
  position: absolute; 
  top: -14px; 
  left: 50%;
  transform: translateX(-50%);
  background: #fffa00; 
  color: #000; 
  font-weight: 800; 
  padding: 6px 16px; 
  border-radius: 20px; 
  font-size: 0.75rem; 
  letter-spacing: 1px;
  box-shadow: 0 4px 10px rgba(255, 250, 0, 0.3); 
}

.disabled-card { 
  opacity: 0.5; 
  pointer-events: none; 
}

.plan-header { margin-bottom: 24px; }
.plan-header h3 { font-size: 1.5rem; margin: 0 0 8px 0; color: #fff; }
.plan-desc { font-size: 0.85rem; color: #888; margin: 0; }

.price-container {
  display: flex;
  align-items: baseline;
  margin-bottom: 30px;
  border-bottom: 1px solid #333;
  padding-bottom: 24px;
}

.currency { font-size: 1.5rem; font-weight: bold; color: #fff; margin-right: 4px; }
.amount { font-size: 3.5rem; font-weight: 800; line-height: 1; color: #fff; }
.period { font-size: 1rem; color: #888; margin-left: 8px; }

.features-list { list-style: none; padding: 0; margin: 0 0 40px 0; flex-grow: 1; }
.features-list li { margin-bottom: 16px; font-size: 0.95rem; display: flex; align-items: center; color: #d1d1d1; }
.features-list li::before { 
  content: "✓"; 
  margin-right: 12px; 
  color: #10b981; 
  font-weight: bold; 
  font-size: 1.1rem;
}
.plan-card.featured .features-list li::before { color: #fffa00; }

/* Style vert émeraude doux pour l'indicateur d'activation immédiate */
.immediate-activation {
  color: #6ee7b7 !important;
  font-weight: bold;
}
.plan-card.featured .immediate-activation {
  color: #fffa00 !important;
}

.btn-plan { 
  width: 100%; 
  padding: 16px; 
  font-weight: bold; 
  border-radius: 8px; 
  cursor: pointer; 
  transition: all 0.2s ease; 
  font-size: 1rem; 
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 52px;
}

.base-btn {
  background: transparent;
  color: #fff;
  border: 1px solid #555;
}
.base-btn:hover { background: #fff; color: #000; border-color: #fff; }

.featured-btn {
  background: #fffa00;
  color: #000;
  border: 1px solid #fffa00;
}
.featured-btn:hover {
  background: #e6e000;
  box-shadow: 0 4px 15px rgba(255, 250, 0, 0.4);
}

.btn-plan:disabled { opacity: 0.7; cursor: not-allowed; }

.loader {
  border: 3px solid rgba(255,255,255,0.3);
  border-top: 3px solid #fff;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}
.loader-dark {
  border: 3px solid rgba(0,0,0,0.2);
  border-top: 3px solid #000;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 1024px) {
  .plan-card.featured { transform: scale(1); }
  .plan-card.featured:hover { transform: translateY(-8px); }
}

@media (max-width: 768px) {
  .billing-container {
    padding: 32px 14px;
  }
  .main-title {
    font-size: 1.8rem;
    line-height: 1.25;
  }
  .subtitle {
    font-size: 0.95rem;
  }
  .billing-mode-selector {
    width: 100%;
    border-radius: 14px;
    margin-bottom: 28px;
  }
  .selector-btn {
    flex: 1 1 100%;
    width: 100%;
    border-radius: 10px;
    font-size: 0.85rem;
    padding: 10px 12px;
  }
  .plans-grid {
    gap: 18px;
  }
  .plan-card {
    max-width: none;
    padding: 34px 18px 22px;
  }
  .amount {
    font-size: 2.8rem;
  }
}
</style>