<template>
  <div class="settings-container">
    <h2>Paramètres du compte</h2>
    
    <div class="danger-zone">
      <h3>Zone de Danger Absolu</h3>
      <p>
        Si vous résiliez votre espace, vos données seront immédiatement purgées.
      </p>
      
      <button @click="handleDestroyAccount" :disabled="loading" class="btn-destroy">
        {{ loading ? 'SUPPRESSION...' : 'ANNULER L\'ABONNEMENT ET SUPPRIMER' }}
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
  const confirmation = confirm("Êtes-vous certain ? Cette action est irréversible.")
  if (!confirmation) return

  loading.value = true
  try {
    const token = localStorage.getItem('token')
    // Vérifie bien que ton API répond à cette route
    await axios.delete(`${import.meta.env.VITE_API_URL}/companies/danger-delete`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    alert("Compte supprimé avec succès.")
    localStorage.clear()
    router.push('/login')
  } catch (err) {
    console.error(err)
    alert("Erreur lors de la suppression.")
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Ajoute une hauteur minimale pour forcer l'affichage */
.settings-container { padding: 40px; background-color: #fff; min-height: 500px; }
.danger-zone { border: 2px dashed #d32f2f; padding: 25px; border-radius: 8px; }
.btn-destroy { background-color: #d32f2f; color: #fff; padding: 12px; cursor: pointer; }
</style>
