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

          <label>Mail d'identification</label>
          <input v-model="form.email" type="email" placeholder="patron@entreprise.com" required />

          <label>Mot de passe</label>
          <div class="password-wrapper">
            <input 
              v-model="form.password" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="••••••••" 
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

          <div class="consent-block">
            <label class="consent-label">
              <input v-model="form.acceptedConfidentialityAgreement" type="checkbox" />
              <span>
                Je déclare avoir lu et accepté l'
                <router-link to="/confidentiality-agreement" target="_blank">Engagement de confidentialité PME</router-link>
                et j'autorise le traitement des informations strictement nécessaires à mon immatriculation.
              </span>
            </label>
          </div>

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

const showPassword = ref(false)

const form = reactive({
  companyName: '',
  country: '',
  currency: 'USD',
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
/* Base */
.login-container { 
  display: flex; 
  height: 100vh; 
  font-family: 'ABeeZee', sans-serif; 
}

/* 🌟 NOUVEAU LEFT PANEL : Identique à la page de Login (Responsive & Élastique) */
.left-panel { 
  width: 40%; 
  background-color: #000000; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  padding: 0 10%; 
  box-sizing: border-box; 
}

.branding { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  text-align: center; 
  width: 100%; 
}

.logo-rem { 
  width: 100%; 
  max-width: 320px; 
  height: auto; 
  margin-bottom: 25px; 
}

.title { 
  color: #FFFAFA; 
  font-size: min(1.8vw, 30px); /* S'adapte au pixel près au zoom */
  letter-spacing: 2px; 
  font-weight: 300; 
  white-space: nowrap; 
  font-family: 'Ysabeau Office', sans-serif; 
  margin: 0;
}

/* Formulaire et layout de droite */
.right-panel { 
  flex: 1; 
  background-color: #FFFAFA; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  padding: 20px; 
}
.form-wrapper { width: 100%; max-width: 450px; }
.form-title { font-size: 22px; font-weight: bold; margin-bottom: 24px; color: #000; }
.login-form label { font-weight: 600; margin-bottom: 5px; display: block; color: #333; font-size: 0.9rem; }
.login-form input, .currency-select { width: 100%; padding: 12px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; font-family: inherit; }
.currency-select { background-color: #fff; cursor: pointer; }
.name-row { display: flex; gap: 15px; }
.input-half { flex: 1; }

/* Mot de passe et Icône Œil */
.password-wrapper {
  position: relative;
  width: 100%;
}
.password-wrapper input {
  padding-right: 45px; 
}
.toggle-password {
  position: absolute;
  right: 12px;
  top: 36%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto !important; 
  color: #707070 !important;
}

.eye-icon {
  width: 22px;
  height: 22px;
  transition: color 0.2s ease;
}

.toggle-password:hover {
  color: #000 !important;
}

/* Boutons & Textes */
.login-form button[type="submit"] { width: 100%; background-color: #000; color: #fff; padding: 15px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; }
.error-msg { color: #d32f2f; margin-bottom: 15px; font-size: 0.85rem; font-weight: bold; }
.register-text { margin-top: 20px; text-align: center; color: #707070; }
.register-text a { color: #000; font-weight: bold; text-decoration: none; }

@media (max-width: 768px) { 
  .left-panel { display: none; } 
}
</style>
