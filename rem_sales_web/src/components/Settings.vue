<template>
  <div class="settings-view-wrapper">
    <h2 class="settings-title">Paramètres du compte</h2>
    
    <div class="settings-grid">
      
      <!-- CARTE : À PROPOS DE NOUS -->
      <div class="settings-card about-card">
        <h3 class="card-title">À propos de nous</h3>
        <p class="card-text">
          <strong>Robust Enterprise Management</strong> est une solution conçue pour propulser la gestion des PME. Notre mission est de simplifier votre quotidien en centralisant vos stocks, vos réseaux de revendeurs et votre facturation sur une interface unique, évolutive et robuste. Développé avec passion pour accompagner votre croissance.
        </p>
      </div>

      <!-- CARTE : ASSISTANCE & CONTACT -->
      <div class="settings-card support-card">
        <h3 class="card-title">Assistance & Support</h3>
        <p class="card-subtitle">Une question ? Un problème technique ? Notre équipe est à votre écoute.</p>
        <p class="sla-text">🕒 <strong>Nous vous recontactons dans les 2 prochaines heures</strong> (hors week-end).</p>
        
        <form @submit.prevent="handleContactSubmit" class="support-form">
          <div class="form-group">
            <label>Nom & Prénom</label>
            <input type="text" v-model="contactForm.name" placeholder="Votre nom" required />
          </div>
          <div class="form-group">
            <label>Email ou Téléphone</label>
            <input type="text" v-model="contactForm.contactInfo" placeholder="Comment vous joindre ?" required />
          </div>
          <div class="form-group">
            <label>Sujet</label>
            <select v-model="contactForm.subject" required>
              <option value="" disabled>Sélectionnez un sujet...</option>
              <option value="bug">Problème technique / Bug</option>
              <option value="billing">Question sur la facturation</option>
              <option value="feature">Suggestion d'amélioration</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div class="form-group">
            <label>Votre message</label>
            <textarea v-model="contactForm.message" rows="4" placeholder="Décrivez votre demande ici..." required></textarea>
          </div>
          <button type="submit" class="btn-submit" :disabled="isSending">
            {{ isSending ? 'Envoi en cours...' : 'Envoyer la demande' }}
          </button>
        </form>
      </div>

      <!-- CARTE : ZONE DE DANGER (Votre code d'origine) -->
      <div class="settings-card danger-zone-box">
        <h3 class="danger-title">Zone de Danger Absolu</h3>
        <p class="danger-text">
          Si vous résiliez votre espace au cours des 30 jours d'essai, votre carte ne sera jamais débitée. Toutes vos données locales et d'inventaire REM seront immédiatement purgées définitivement.
        </p>
        
        <button @click="handleDestroyAccount" :disabled="loading" class="btn-destroy">
          {{ loading ? 'CLÔTURE DU COMPTE EN COURS...' : 'ANNULER L\'ESSAI & SUPPRIMER LE COMPTE' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const loading = ref(false)
const isSending = ref(false)
const router = useRouter()

// État du formulaire de contact
const contactForm = reactive({
  name: '',
  contactInfo: '',
  subject: '',
  message: ''
})

// Logique d'envoi du formulaire de contact
const handleContactSubmit = async () => {
  isSending.value = true
  try {
    // 🚀 À remplacer par l'URL de votre API pour l'envoi d'emails ou de tickets
    // const token = localStorage.getItem('token')
    // await axios.post(`${import.meta.env.VITE_API_URL}/support/contact`, contactForm, {
    //   headers: { Authorization: `Bearer ${token}` }
    // })
    
    // Simulation d'un délai réseau pour la démo
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    alert("Votre demande a bien été envoyée. Nous vous recontacterons très vite !")
    
    // Réinitialisation du formulaire
    contactForm.name = ''
    contactForm.contactInfo = ''
    contactForm.subject = ''
    contactForm.message = ''
  } catch (err) {
    alert("Une erreur s'est produite lors de l'envoi du message.")
  } finally {
    isSending.value = false
  }
}

// Logique de suppression du compte (Votre code d'origine)
const handleDestroyAccount = async () => {
  const confirmation = confirm("CONFIRMATION CRUCIALE :\nÊtes-vous certain de vouloir détruire votre entreprise ? Votre période d'essai Stripe sera instantanément annulée et vos données supprimées définitivement.")
  if (!confirmation) return

  loading.value = true
  try {
    const token = localStorage.getItem('token')
    
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
  padding-bottom: 40px;
}
.settings-title { 
  color: #000; 
  font-family: 'Ysabeau Office', sans-serif; 
  font-size: 2rem; 
  margin-bottom: 30px; 
}

/* Grille pour espacer les cartes */
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 600px;
}

/* Style de base pour toutes les cartes */
.settings-card {
  padding: 25px; 
  border-radius: 8px; 
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid #eaeaea;
}
.card-title {
  margin-top: 0;
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}
.card-subtitle {
  color: #555;
  font-size: 0.95rem;
  margin-bottom: 10px;
}
.card-text {
  color: #555;
  font-size: 0.95rem;
  line-height: 1.6;
}
.sla-text {
  color: #2e7d32; /* Vert rassurant */
  font-size: 0.9rem;
  background-color: #e8f5e9;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: inline-block;
}

/* Formulaire de support */
.support-form .form-group {
  margin-bottom: 15px;
}
.support-form label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 5px;
  font-weight: bold;
}
.support-form input,
.support-form select,
.support-form textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  box-sizing: border-box;
}
.support-form input:focus,
.support-form select:focus,
.support-form textarea:focus {
  outline: none;
  border-color: #333;
}
.btn-submit {
  background-color: #333;
  color: #fff;
  border: none;
  padding: 12px 24px;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
}
.btn-submit:hover { background-color: #555; }
.btn-submit:disabled { background-color: #999; cursor: not-allowed; }

/* Zone de danger (Styles originaux conservés) */
.danger-zone-box { 
  border: 2px dashed #d32f2f; 
  background-color: #fffafaf; 
  box-shadow: none;
}
.danger-title { color: #d32f2f; margin-top: 0; font-size: 1.2rem; font-weight: bold; }
.danger-text { color: #555; font-size: 0.9rem; line-height: 1.5; margin-bottom: 20px; }
.btn-destroy { background-color: #d32f2f; color: #fff; border: none; padding: 12px 24px; font-weight: bold; border-radius: 6px; cursor: pointer; transition: background 0.2s; width: 100%; }
.btn-destroy:hover { background-color: #b71c1c; }
.btn-destroy:disabled { background-color: #ef9a9a; cursor: not-allowed; }

/* Responsive */
@media (max-width: 768px) {
  .settings-title { font-size: 1.5rem; margin-bottom: 18px; }
  .settings-card { padding: 16px; }
  .btn-destroy, .btn-submit { padding: 12px 10px; line-height: 1.35; white-space: normal; }
}
</style>
