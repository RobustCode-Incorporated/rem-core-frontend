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
        <h1 class="form-title">Connexion Administrateur</h1>

        <form class="login-form" @submit.prevent="handleLogin">
          <label>Identifiant</label>
          <input v-model="credentials.email" type="email" placeholder="patron@entreprise.com" required />

          <label>Mot de passe</label>
          <div class="password-wrapper">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="credentials.password" 
              placeholder="••••••••" 
              required 
            />
            <button 
              type="button" 
              class="toggle-password" 
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
            >
              <!-- Icône Œil barré -->
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="eye-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 1-4.243-4.243m4.243 4.243L9.35 9.35" />
              </svg>
              
              <!-- Icône Œil normal -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="eye-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>
          </div>

          <button type="submit" :disabled="loading">
            {{ loading ? 'Connexion en cours...' : 'SE CONNECTER' }}
          </button>
        </form>

        <p class="register-text">
          Pas encore de compte ?
          <router-link to="/register">S’enregistrer</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const credentials = ref({ email: '', password: '' });
const showPassword = ref(false);

const handleLogin = async () => {
  loading.value = true;
  try {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, credentials.value);

    localStorage.setItem('token', res.data.token);
    localStorage.setItem('companyId', res.data.user.companyId);
    localStorage.setItem('userRole', res.data.user.role); 
    localStorage.setItem('userId', res.data.user.id);
    localStorage.setItem('resellerId', res.data.user.id);

    const companyData = res.data.company || res.data.user.company || {};
    
    if (companyData.plan_type || res.data.plan_type) {
      const plan = companyData.plan_type || res.data.plan_type;
      localStorage.setItem('plan_type', plan);
      localStorage.setItem('chosen_plan', plan);
    }
    
    if (companyData.currency) {
      localStorage.setItem('companyCurrency', companyData.currency);
    }

    const isPremium = companyData.is_premium || res.data.is_premium;
    if (isPremium) {
      localStorage.setItem('is_premium', 'true');
    }

    const role = res.data.user.role;
    if (role === 'ADMIN') {
      router.push('/dashboard');
    } else if (role === 'STAFF') {
      router.push('/reseller-dashboard');
    } else {
      console.warn("Rôle inconnu, redirection par défaut.");
      router.push('/dashboard');
    }

  } catch (err) {
    console.error("Erreur login :", err);
    alert("Identifiants incorrects.");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container { 
  display: flex; 
  height: 100vh; 
  font-family: 'ABeeZee', sans-serif; 
}

.left-panel { 
  width: 40%; 
  background-color: #000000; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  /* 🌟 On force des marges intérieures (10% de la largeur du panneau) pour garantir l'espace vide aux extrémités */
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
  /* 🌟 La magie opère ici : 
     1.8vw signifie "1.8% de la largeur totale de l'écran".
     Quand tu zoomes, l'écran "rétrécit" virtuellement, donc le texte rétrécit tout seul !
     Le min() l'empêche juste de devenir géant sur un écran 4K (bloqué à 30px max).
     Il n'y a PAS de limite minimum, donc il peut rétrécir à l'infini en cas de zoom extrême.
  */
  font-size: min(1.8vw, 30px); 
  letter-spacing: 2px; 
  font-weight: 300; 
  white-space: nowrap; 
  font-family: 'Ysabeau Office', sans-serif; 
  margin: 0;
}

.right-panel { 
  flex: 1; 
  background-color: #FFFAFA; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  padding: 20px; 
}

.form-wrapper { width: 100%; max-width: 400px; }
.form-title { font-size: 22px; font-weight: bold; margin-bottom: 24px; color: #000; }
.login-form label { font-weight: 600; margin-bottom: 5px; display: block; color: #333; }
.login-form input { width: 100%; padding: 12px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }

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

.login-form button[type="submit"] { width: 100%; background-color: #000; color: #fff; padding: 15px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
.register-text { margin-top: 20px; text-align: center; color: #707070; }
.register-text a { color: #000; font-weight: bold; text-decoration: none; }

@media (max-width: 768px) { 
  .left-panel { display: none; } 
}
</style>