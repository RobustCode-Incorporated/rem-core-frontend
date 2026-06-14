<template>
  <div class="portal-wrapper">
    <div class="action-card">
      <div class="geo-indicator-zone">
        <div :class="['radar-circle', { 'pulsing': loading }]"></div>
      </div>

      <h3>Géolocalisation</h3>
      <p>Mettez à jour votre position actuelle pour valider votre affectation et vos flux logistiques.</p>
      
      <button @click="updateLocation" :disabled="loading" class="btn-geo">
        {{ loading ? 'Synchronisation en cours...' : 'Actualiser ma position GPS' }}
      </button>

      <div v-if="statusMessage" :class="['status-msg', statusType]">
        {{ statusMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const loading = ref(false)
const statusMessage = ref('')
const statusType = ref('')

const updateLocation = () => {
  // 1. Vérification du support API du navigateur
  if (!navigator.geolocation) {
    statusMessage.value = "Géolocalisation non supportée par votre terminal."
    statusType.value = 'error'
    return
  }

  // 2. Extraction et sécurisation de l'identifiant revendeur
  const resellerId = localStorage.getItem('resellerId') || localStorage.getItem('userId');
  if (!resellerId || resellerId === 'null') {
    statusMessage.value = "Erreur d'authentification : Identifiant de session introuvable."
    statusType.value = 'error'
    return
  }

  loading.value = true
  statusMessage.value = ""

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords
        const token = localStorage.getItem('token')
        
        // 3. Payload, headers d'autorisation et URL alignée sur le salesRouter backend
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/sales/resellers/${resellerId}/location`, 
          { latitude, longitude },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        
        statusMessage.value = "Position géographique synchronisée avec succès."
        statusType.value = 'success'
        
        // Feedback haptique discret sur mobile si supporté
        if (navigator.vibrate) navigator.vibrate(200)
      } catch (err) {
        console.error("❌ [GEO SYNCHRO ERROR] :", err)
        statusMessage.value = "Échec de la transmission des coordonnées au serveur REM."
        statusType.value = 'error'
      } finally {
        loading.value = false
      }
    },
    (geoError) => {
      console.warn("⚠️ [GEO PERMISSION DENIED] :", geoError)
      statusMessage.value = "Accès aux données de localisation refusé par l'appareil."
      statusType.value = 'error'
      loading.value = false
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}
</script>

<style scoped>
.portal-wrapper { 
  width: 100%; 
  max-width: 450px; 
  margin: 0 auto;
}

.action-card { 
  background: #ffffff; 
  padding: 40px 30px; 
  border-radius: 8px; 
  border: 1px solid #e2e8f0;
  text-align: center; 
}

.action-card h3 {
  font-size: 1.2rem;
  color: #000000;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-card p {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 25px 0;
}

/* Design de l'indicateur Radar Minimaliste */
.geo-indicator-zone {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
}

.radar-circle {
  width: 16px;
  height: 16px;
  background: #000000;
  border-radius: 50%;
  position: relative;
}

.radar-circle.pulsing::after {
  content: '';
  position: absolute;
  top: -16px;
  left: -16px;
  width: 44px;
  height: 44px;
  border: 2px solid #000000;
  border-radius: 50%;
  animation: radar-pulse 1.2s infinite ease-out;
  opacity: 0;
}

@keyframes radar-pulse {
  0% { transform: scale(0.3); opacity: 0.8; }
  100% { transform: scale(1.2); opacity: 0; }
}

/* Bouton Corporate */
.btn-geo { 
  background: #000000; 
  color: #ffffff; 
  border: none; 
  padding: 16px 20px; 
  border-radius: 4px; 
  cursor: pointer; 
  width: 100%; 
  font-size: 0.9rem;
  font-weight: 600; 
  transition: background 0.2s ease; 
}

.btn-geo:hover:not(:disabled) {
  background: #222222;
}

.btn-geo:disabled { 
  background: #888888; 
  cursor: not-allowed;
}

/* Zone de feedback d'état strict */
.status-msg { 
  margin-top: 20px; 
  padding: 12px 16px; 
  border-radius: 4px; 
  font-size: 0.82rem; 
  font-weight: 500;
  text-align: left;
}

.success { 
  background: #f0fdf4; 
  color: #166534; 
  border: 1px solid #bbf7d0;
}

.error { 
  background: #fef2f2; 
  color: #991b1b; 
  border: 1px solid #fecaca;
}
</style>