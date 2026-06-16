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
          <label>Email professionnel</label>
          <input v-model="credentials.email" type="email" placeholder="patron@entreprise.com" required />

          <label>Mot de passe</label>
          <input type="password" v-model="credentials.password" placeholder="••••••••" required />

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

const handleLogin = async () => {
  loading.value = true;
  try {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, credentials.value);

    // 1. Sauvegarde sécurisée des identifiants de base
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('companyId', res.data.user.companyId);
    localStorage.setItem('userRole', res.data.user.role); 
    localStorage.setItem('userId', res.data.user.id);
    localStorage.setItem('resellerId', res.data.user.id);

    // 🎯 CORRECTION CRUCIALE : Sauvegarde du plan et de la monnaie (currency)
    // On extrait dynamiquement les infos de la compagnie (adapte si ton backend structure res.data différemment)
    const companyData = res.data.company || res.data.user.company || {};
    
    // Si le backend renvoie le plan, on le sauvegarde pour valider le ticket d'entrée au Dashboard
    if (companyData.plan_type || res.data.plan_type) {
      localStorage.setItem('plan_type', companyData.plan_type || res.data.plan_type);
      localStorage.setItem('chosen_plan', companyData.plan_type || res.data.plan_type);
    }
    
    // On met aussi en place la monnaie de l'entreprise (USD par défaut) pour plus tard
    if (companyData.currency) {
      localStorage.setItem('currency', companyData.currency);
    }

    // Sauvegarde du statut premium
    const isPremium = companyData.is_premium || res.data.is_premium;
    if (isPremium) {
      localStorage.setItem('is_premium', 'true');
    }

    // 2. Logique de redirection
    const role = res.data.user.role;
    
    if (role === 'ADMIN') {
      router.push('/dashboard');
    } 
    else if (role === 'STAFF') {
      router.push('/reseller-dashboard');
    } 
    else {
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
/* Tes styles restent absolument identiques */
.login-container { display: flex; height: 100vh; font-family: 'ABeeZee', sans-serif; }
.left-panel { width: 40%; background-color: #000000; display: flex; align-items: center; justify-content: center; }
.branding { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px; width: 100%; }
.logo-rem { width: 550px; height: auto; margin-bottom: 30px; }
.title { color: #FFFAFA; font-size: 2.2rem; letter-spacing: 2px; font-weight: 300; white-space: nowrap; width: 100%; font-family: 'Ysabeau Office', sans-serif; }
.right-panel { flex: 1; background-color: #FFFAFA; display: flex; align-items: center; justify-content: center; padding: 20px; }
.form-wrapper { width: 100%; max-width: 400px; }
.form-title { font-size: 22px; font-weight: bold; margin-bottom: 24px; color: #000; }
.login-form label { font-weight: 600; margin-bottom: 5px; display: block; color: #333; }
.login-form input { width: 100%; padding: 12px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }
.login-form button { width: 100%; background-color: #000; color: #fff; padding: 15px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
.register-text { margin-top: 20px; text-align: center; color: #707070; }
.register-text a { color: #000; font-weight: bold; text-decoration: none; }

@media (max-width: 768px) {
  .left-panel { display: none; }
}
</style>