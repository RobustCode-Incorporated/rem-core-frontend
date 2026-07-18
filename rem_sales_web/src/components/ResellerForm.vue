<template>
  <div class="form-container">
    <div class="form-header">
      <h2>Ajouter un nouveau revendeur</h2>
    </div>

    <form @submit.prevent="submitReseller" class="reseller-form">
      <div class="form-row">
        <div class="form-group">
          <label>Prénom</label>
          <input v-model="form.firstName" type="text" placeholder="Ex: Jean" required />
        </div>
        <div class="form-group">
          <label>Nom</label>
          <input v-model="form.lastName" type="text" placeholder="Ex: Dupont" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Email (Connexion)</label>
          <input v-model="form.email" type="email" placeholder="revendeur@email.com" required />
        </div>
        <div class="form-group">
          <label>Téléphone</label>
          <input v-model="form.phone" type="tel" placeholder="+243 XXX XXX XXX" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Nom du Dépôt</label>
          <input v-model="form.deposit_name" type="text" placeholder="Ex: Dépôt Centre-Ville" required />
        </div>
        <div class="form-group">
          <label>Mot de passe</label>
          <div class="password-wrapper">
            <input 
              v-model="form.password" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="********" 
              required 
            />
            <button 
              type="button" 
              class="toggle-password" 
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
            >
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="eye-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 1-4.243-4.243m4.243 4.243L9.35 9.35" />
              </svg>
              
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="eye-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <button type="submit" class="btn-submit" :disabled="loading">
        {{ loading ? 'Enregistrement...' : 'Créer le compte revendeur' }}
      </button>
    </form>

    <hr class="divider" />

    <div class="list-section">
      <h3>Liste des revendeurs</h3>
      <div class="table-scroll">
        <table class="reseller-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Dépôt</th>
              <th>Téléphone</th>
              <th>Statut GPS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reseller in resellers" :key="reseller.id">
              <td>{{ reseller.name }}</td>
              <td>{{ reseller.email }}</td>
              <td>{{ reseller.deposit_name }}</td>
              <td>{{ reseller.phone }}</td>
              <td>
                <span :class="['badge', reseller.latitude ? 'ok' : 'wait']">
                  {{ reseller.latitude ? 'Localisé' : 'En attente' }}
                </span>
              </td>
            </tr>
            <tr v-if="resellers.length === 0">
              <td colspan="5" class="empty-msg">Aucun revendeur enregistré.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const loading = ref(false)
const resellers = ref([])

// Variable pour gérer la visibilité du mot de passe
const showPassword = ref(false)

const form = ref({ 
  firstName: '', 
  lastName: '', 
  email: '', 
  password: '', 
  phone: '', 
  deposit_name: '' 
})

/**
 * Extraction sécurisée de la liste des revendeurs
 */
const fetchResellers = async () => {
  try {
    const companyId = localStorage.getItem('companyId')
    const token = localStorage.getItem('token')

    const res = await axios.get(`${import.meta.env.VITE_API_URL}/resellers`, {
      params: { company_id: companyId },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    resellers.value = res.data.data || []
    
  } catch (err) { 
    console.error("❌ Erreur lors du chargement des revendeurs :", err) 
  }
}

/**
 * Soumission transactionnelle pour la création d'un compte revendeur
 */
const submitReseller = async () => {
  loading.value = true
  try {
    const companyId = localStorage.getItem('companyId')
    const token = localStorage.getItem('token')

    await axios.post(`${import.meta.env.VITE_API_URL}/resellers/create-with-access`, {
      ...form.value,
      company_id: companyId
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    alert('Revendeur créé avec succès et accès généré !')
    form.value = { firstName: '', lastName: '', email: '', password: '', phone: '', deposit_name: '' }
    await fetchResellers() 
  } catch (error) {
    console.error("❌ Échec de la création :", error)
    alert('Erreur lors de la création : vérifiez que l\'email n\'est pas déjà utilisé.')
  } finally {
    loading.value = false
  }
}

onMounted(fetchResellers)
</script>

<style scoped>
.form-container { background: white; padding: 40px; border-radius: 8px; max-width: 700px; margin: 0 auto; font-family: 'ABeeZee', sans-serif; }
.form-header { margin-bottom: 30px; }
.reseller-form { display: flex; flex-direction: column; gap: 20px; margin-bottom: 40px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
input { padding: 14px; border: 1px solid #ddd; border-radius: 6px; width: 100%; box-sizing: border-box; }

/* Alignement et intégration transparente de l'œil */
.password-wrapper {
  position: relative;
  width: 100%;
}
.password-wrapper input {
  padding-right: 45px; /* Empêche le texte de glisser sous l'icône */
}
.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto !important; 
  color: #707070 !important; /* Couleur grise d'origine */
}

.eye-icon {
  width: 22px;
  height: 22px;
  transition: color 0.2s ease;
}

.toggle-password:hover {
  color: #000 !important; /* L'icône devient noire au survol */
}

.btn-submit { background: #000; color: #fff; border: none; padding: 15px; border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-submit:disabled { background: #555; cursor: not-allowed; }
.divider { border: 0; border-top: 1px solid #eee; margin: 30px 0; }
.reseller-table { width: 100%; border-collapse: collapse; }
.reseller-table th, .reseller-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; font-size: 0.9rem; }
.badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
.badge.ok { background: #e8f5e9; color: #2e7d32; }
.badge.wait { background: #fff3e0; color: #ef6c00; }
.empty-msg { text-align: center; color: #999; padding: 20px; }
.table-scroll { overflow-x: auto; }
.reseller-table { min-width: 680px; }

@media (max-width: 768px) {
  .form-container {
    padding: 16px;
  }
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>