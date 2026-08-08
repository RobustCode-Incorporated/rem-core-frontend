<template>
  <div class="settings-view-wrapper">
    <h2 class="settings-title">{{ $t('settings.title') }}</h2>
    
    <div class="settings-grid">
      
      <!-- CARTE : À PROPOS DE NOUS -->
      <div class="settings-card about-card">
        <h3 class="card-title">{{ $t('settings.about.title') }}</h3>
        <p class="card-text">
          <strong>Robust Enterprise Management</strong> {{ $t('settings.about.text') }}
        </p>
      </div>

      <!-- CARTE : ASSISTANCE & CONTACT -->
      <div class="settings-card support-card">
        <h3 class="card-title">{{ $t('settings.support.title') }}</h3>
        <p class="card-subtitle">{{ $t('settings.support.subtitle') }}</p>
        <p class="sla-text">🕒 <strong>{{ $t('settings.support.sla') }}</strong></p>
        
        <form @submit.prevent="handleContactSubmit" class="support-form">
          <div class="form-group">
            <label>{{ $t('settings.support.nameLabel') }}</label>
            <input type="text" v-model="contactForm.name" :placeholder="$t('settings.support.namePlaceholder')" required />
          </div>
          <div class="form-group">
            <label>{{ $t('settings.support.contactLabel') }}</label>
            <input type="text" v-model="contactForm.contactInfo" :placeholder="$t('settings.support.contactPlaceholder')" required />
          </div>
          <div class="form-group">
            <label>{{ $t('settings.support.subjectLabel') }}</label>
            <select v-model="contactForm.subject" required>
              <option value="" disabled>{{ $t('settings.support.subjectPlaceholder') }}</option>
              <option value="bug">{{ $t('settings.support.subjectBug') }}</option>
              <option value="billing">{{ $t('settings.support.subjectBilling') }}</option>
              <option value="feature">{{ $t('settings.support.subjectFeature') }}</option>
              <option value="other">{{ $t('settings.support.subjectOther') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ $t('settings.support.messageLabel') }}</label>
            <textarea v-model="contactForm.message" rows="4" :placeholder="$t('settings.support.messagePlaceholder')" required></textarea>
          </div>
          <button type="submit" class="btn-submit" :disabled="isSending">
            {{ isSending ? $t('settings.support.sending') : $t('settings.support.submit') }}
          </button>
        </form>
      </div>

      <!-- CARTE : ZONE DE DANGER (Votre code d'origine) -->
      <div class="settings-card danger-zone-box">
        <h3 class="danger-title">{{ $t('settings.danger.title') }}</h3>
        <p class="danger-text">
          {{ $t('settings.danger.text') }}
        </p>
        
        <button @click="handleDestroyAccount" :disabled="loading" class="btn-destroy">
          {{ loading ? $t('settings.danger.loading') : $t('settings.danger.submit') }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
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

// Logique d'envoi du formulaire via WhatsApp
const handleContactSubmit = () => {
  isSending.value = true
  
  try {
    // Format : indicatif pays (ex: 32 pour Belgique, 33 pour France) + numéro sans le 0 au début
    const whatsappNumber = '+32467613480' 
    
    // Formatage du message pour WhatsApp
    const messageText = `*Nouvelle demande d'assistance (REM)* 🛠️\n\n` +
      `*Nom :* ${contactForm.name}\n` +
      `*Contact :* ${contactForm.contactInfo}\n` +
      `*Sujet :* ${contactForm.subject}\n\n` +
      `*Message :*\n${contactForm.message}`
    
    // Encodage du texte pour qu'il soit compatible avec une URL
    const encodedText = encodeURIComponent(messageText)
    
    // Création du lien WhatsApp
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedText}`
    
    // Ouvre WhatsApp dans un nouvel onglet ou lance l'application
    window.open(whatsappUrl, '_blank')
    
    // Réinitialisation du formulaire après l'envoi
    contactForm.name = ''
    contactForm.contactInfo = ''
    contactForm.subject = ''
    contactForm.message = ''
    
  } catch (err) {
    alert(t('settings.support.whatsappError'))
  } finally {
    isSending.value = false
  }
}

// Logique de suppression du compte (Votre code d'origine)
const handleDestroyAccount = async () => {
  const confirmation = confirm(t('settings.danger.confirm'))
  if (!confirmation) return

  loading.value = true
  try {
    const token = localStorage.getItem('token')
    
    await axios.delete(`${import.meta.env.VITE_API_URL}/auth/companies/danger-delete`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    alert(t('settings.danger.success'))
    localStorage.clear()
    router.push('/register')
  } catch (err) {
    alert(err.response?.data?.error || t('settings.danger.error'))
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
