<template>
  <div class="login-container">
    <div class="left-panel">
      <div class="branding">
        <img src="../assets/RobustCodelogowhite.png" alt="Logo REM" class="logo-rem" />
        <h1 class="title">ROBUST ENTERPRISE MANAGEMENT</h1>
      </div>
    </div>

    <div class="right-panel">
      <div class="form-wrapper">
        <h1 class="form-title">Création d'espace PME</h1>
        
        <form class="login-form" @submit.prevent="handleRegister">
          <label>Nom de l'entreprise</label>
          <input v-model="form.companyName" placeholder="Ex: Pharmacie du Centre" required />

          <div class="name-row">
            <div class="input-half">
              <label>Pays</label>
              <input v-model="form.country" placeholder="Ex: RDC" required />
            </div>
            <div class="input-half">
              <label>Devise Principale</label>
              <select v-model="form.currency" class="currency-select" required>
                <option value="USD">Dollar Américain (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="CDF">Franc Congolais (CDF)</option>
                <option value="XOF">Franc CFA (XOF)</option>
              </select>
            </div>
          </div>

          <div class="name-row">
            <div class="input-half">
              <label>Prénom</label>
              <input v-model="form.firstName" placeholder="Prénom" required />
            </div>
            <div class="input-half">
              <label>Nom</label>
              <input v-model="form.lastName" placeholder="Nom" required />
            </div>
          </div>

          <label>Email professionnel</label>
          <input v-model="form.email" type="email" placeholder="patron@entreprise.com" required />

          <label>Mot de passe</label>
          <input v-model="form.password" type="password" placeholder="••••••••" required />

          <div v-if="error" class="error-msg">{{ error }}</div>

          <button type="submit" :disabled="loading">
            {{ loading ? 'Activation en cours...' : 'ACTIVER MON ESPACE' }}
          </button>
        </form>

        <p class="register-text">
          Déjà un compte ? 
          <router-link to="/login">Se connecter</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const error = ref('')

const form = reactive({
  companyName: '',
  country: '',
  currency: 'USD', // Devise par défaut ($)
  firstName: '',
  lastName: '',
  email: '',
  password: ''
})

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  try {
    await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, form)
    alert("Compte créé avec succès !")
    router.push('/login')
  } catch (err) {
    error.value = err.response?.data?.error || "Une erreur est survenue."
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Styles existants conservés */
.login-container { display: flex; height: 100vh; font-family: 'ABeeZee', sans-serif; }
.left-panel { width: 40%; background-color: #000000; display: flex; align-items: center; justify-content: center; }
.branding { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px; width: 100%; }
.logo-rem { width: 550px; height: auto; margin-bottom: 30px; }
.title { color: #FFFAFA; font-size: 2.2rem; letter-spacing: 2px; font-weight: 300; white-space: nowrap; width: 100%; font-family: 'Ysabeau Office', sans-serif; }
.right-panel { flex: 1; background-color: #FFFAFA; display: flex; align-items: center; justify-content: center; padding: 20px; }
.form-wrapper { width: 100%; max-width: 450px; }
.form-title { font-size: 22px; font-weight: bold; margin-bottom: 24px; color: #000; }
.login-form label { font-weight: 600; margin-bottom: 5px; display: block; color: #333; font-size: 0.9rem; }
.login-form input, .currency-select { width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; font-family: inherit; }
.currency-select { background-color: #fff; cursor: pointer; }
.name-row { display: flex; gap: 15px; }
.input-half { flex: 1; }
.login-form button { width: 100%; background-color: #000; color: #fff; padding: 15px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; }
.error-msg { color: #d32f2f; margin-bottom: 15px; font-size: 0.85rem; font-weight: bold; }
.register-text { margin-top: 20px; text-align: center; color: #707070; }
.register-text a { color: #000; font-weight: bold; text-decoration: none; }
@media (max-width: 768px) { .left-panel { display: none; } }
</style>
