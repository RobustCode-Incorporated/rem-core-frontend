<template>
  <div class="settings-view-wrapper">
    <h2 class="settings-title">Paramètres du compte</h2>
    
    <div class="danger-zone-box">
      <h3 class="danger-title">Zone de Danger Absolu</h3>
      <p class="danger-text">
        Si vous résiliez votre espace au cours des 30 jours d'essai, votre carte ne sera jamais débitée. Toutes vos données locales et d'inventaire REM seront immédiatement purgées définitivement.
      </p>
      
      <button @click="handleDestroyAccount" :disabled="loading" class="btn-destroy">
        {{ loading ? 'CLÔTURE DU COMPTE EN COURS...' : 'ANNULER L\'ESSAI & SUPPRIMER LE COMPTE' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const loading = ref(false)
const router = useRouter()

const handleDestroyAccount = async () => {
  const confirmation = confirm("CONFIRMATION CRUCIALE :\nÊtes-vous certain de vouloir détruire votre entreprise ? Votre période d'essai Stripe sera instantanément annulée et vos données supprimées définitivement.")
  if (!confirmation) return

  loading.value = true
  try {
    const token = localStorage.getItem('token')
    
    // 🚀 MODIFICATION ICI : Ajout de /auth pour correspondre au routeur backend
    await axios.delete(`${import.meta.env.VITE_API_URL}/auth/companies/danger-delete`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    alert("Votre espace a été clôturé proprement. Aucun prélèvement ne sera effectué.")
    localStorage.clear()
    router.push('/register')
  } catch (err) {
    alert(err.response?.data?.error || "Une erreur s'est produite lors de la suppression.")
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.settings-view-wrapper { 
  width: 100%;
  box-sizing: border-box;
  text-align: left;
}
.settings-title { 
  color: #000; 
  font-family: 'Ysabeau Office', sans-serif; 
  font-size: 2rem; 
  margin-bottom: 30px; 
}
.danger-zone-box { 
  border: 2px dashed #d32f2f; 
  padding: 25px; 
  border-radius: 8px; 
  max-width: 600px; 
  background-color: #fff; 
}
.danger-title { color: #d32f2f; margin-top: 0; font-size: 1.2rem; font-weight: bold; }
.danger-text { color: #555; font-size: 0.9rem; line-height: 1.5; margin-bottom: 20px; }
.btn-destroy { background-color: #d32f2f; color: #fff; border: none; padding: 12px 24px; font-weight: bold; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
.btn-destroy:hover { background-color: #b71c1c; }
.btn-destroy:disabled { background-color: #ef9a9a; cursor: not-allowed; }
</style>
