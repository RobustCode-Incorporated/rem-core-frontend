<template>
  <div class="history-module">
    <div class="header-section">
      <h2>Historique des Activités Commerciales</h2>
      <p class="subtitle">Consultez, recherchez et filtrez l'ensemble des transactions de l'établissement</p>
    </div>
    
    <fieldset class="filter-zone no-print">
      <legend>Moteur de recherche et filtres</legend>
      <div class="filter-grid">
        <div class="search-box">
          <label for="search-input">Rechercher une transaction</label>
          <input 
            id="search-input"
            v-model="searchQuery" 
            @input="triggerSearch"
            type="text" 
            placeholder="Par numéro de facture ou client." 
            class="input-field"
          />
        </div>

        <div class="filter-box">
          <label for="status-select">Filtrer par statut</label>
          <select id="status-select" v-model="selectedStatus" @change="resetAndFetch" class="input-field select-field">
            <option value="">Tous les statuts</option>
            <option value="PAID">Payées (PAID)</option>
            <option value="DRAFT">Brouillons (DRAFT)</option>
            <option value="CANCELLED">Annulées (CANCELLED)</option>
          </select>
        </div>
      </div>
    </fieldset>

    <div v-if="loading" class="state-feedback">
      <span class="spinner"></span> Chargement de l'historique des flux...
    </div>

    <div v-else-if="salesHistory.length === 0" class="state-feedback empty-state">
      Aucune transaction (Vente ou Restock) ne correspond à vos critères.
    </div>

    <table v-else class="data-table" :class="{ 'no-print': isModalOpen }">
      <thead>
        <tr>
          <th>Numéro Facture</th>
          <th>Type</th>
          <th>Client / Fournisseur</th>
          <th>Date</th>
          <th>Montant</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="doc in salesHistory" :key="doc.id">
          <td class="font-mono font-bold">{{ doc.number }}</td>
          <td>
            <span :class="['type-badge', doc.type?.toLowerCase()]">
              {{ doc.type === 'RESTOCK_REQUEST' ? 'RESTOCK' : 'VENTE' }}
            </span>
          </td>
          <td class="font-bold">
            {{ doc.client_name || doc.reseller_name || (doc.type === 'RESTOCK_REQUEST' ? 'Dépôt Principal / Fournisseur' : 'Client de passage') }}
            <span v-if="doc.depot_name" class="depot-tag">({{ doc.depot_name }})</span>
          </td>
          <td>{{ formatDate(doc.created_at) }}</td>
          <td class="font-bold text-success">{{ Number(doc.total_amount).toLocaleString() }} $</td>
          <td>
            <span :class="['badge', doc.status.toLowerCase()]">
              {{ doc.status }}
            </span>
          </td>
          <td>
            <button @click="openInvoice(doc)" class="action-btn" title="Consulter le document">Consulter</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        
        <div class="modal-actions-bar no-print">
          <button @click="printInvoice" class="btn-action-print">Imprimer / PDF</button>
          <a :href="whatsappLink" target="_blank" class="btn-action-whatsapp">WhatsApp</a>
          <a :href="emailLink" class="btn-action-email">Email</a>
          
          <button 
            v-if="selectedInvoice.type !== 'RESTOCK_REQUEST' && (selectedInvoice.status === 'PAID' || selectedInvoice.status === 'DRAFT')" 
            @click="handleCancelInvoice(selectedInvoice.id)" 
            class="btn-action-cancel-invoice"
          >
            Annuler la vente
          </button>

          <button @click="closeModal" class="btn-action-close">Fermer</button>
        </div>

        <div class="invoice-paper">
          <div class="invoice-header">
            <div class="logo-container">
              <img :src="logoRobustCode" alt="Robust Code Inc. Logo" class="invoice-logo-img" />
              <p class="company-details">Solutions Technologiques Multi-tenant<br>Bruxelles, Belgique</p>
            </div>
            <div class="invoice-meta-block">
              <h2>{{ selectedInvoice.type === 'RESTOCK_REQUEST' ? 'BON DE COMMANDE / RESTOCK' : 'REÇU DE VENTE' }}</h2>
              <p><strong>N° :</strong> {{ selectedInvoice.number }}</p>
              <p><strong>Date :</strong> {{ formatDate(selectedInvoice.created_at) }}</p>
              <p><strong>Statut :</strong> <span :class="['invoice-status-inline', selectedInvoice.status.toLowerCase()]">{{ selectedInvoice.status }}</span></p>
            </div>
          </div>

          <hr class="invoice-separator" />

          <div class="invoice-bill-to">
            <h3>{{ selectedInvoice.type === 'RESTOCK_REQUEST' ? 'Provenance / Émetteur :' : 'Facturé à / Bénéficiaire :' }}</h3>
            <p class="client-name">
              {{ selectedInvoice.client_name || selectedInvoice.reseller_name || (selectedInvoice.type === 'RESTOCK_REQUEST' ? 'Dépôt Principal / Fournisseur' : 'Client de passage') }}
              <span v-if="selectedInvoice.depot_name" class="depot-tag-modal">({{ selectedInvoice.depot_name }})</span>
            </p>
            <p class="client-details">ID Document : {{ selectedInvoice.id }}</p>
          </div>

          <table class="invoice-items-table">
            <thead>
              <tr>
                <th>Description Produit</th>
                <th class="text-right">Quantité</th>
                <th class="text-right">Prix Unitaire</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in selectedInvoiceItems" :key="item.id">
                <td>{{ item.product_name || 'Article REM System' }}</td>
                <td class="text-right">{{ item.quantity }}</td>
                <td class="text-right">{{ Number(item.unit_price).toLocaleString() }} $</td>
                <td class="text-right font-bold">{{ Number(item.total_price).toLocaleString() }} $</td>
              </tr>
              <tr v-if="itemsLoading">
                <td colspan="4" class="text-center text-muted">Récupération de la structure des articles...</td>
              </tr>
              <tr v-else-if="selectedInvoiceItems.length === 0">
                <td colspan="4" class="text-center text-muted">Aucun article répertorié.</td>
              </tr>
            </tbody>
          </table>

          <div class="invoice-total-block">
            <div class="total-row grand-total">
              <span>Montant Net Global (USD) :</span>
              <span>{{ Number(selectedInvoice.total_amount).toLocaleString() }} $</span>
            </div>
          </div>

          <div class="invoice-footer">
            <p>Merci pour votre confiance.</p>
            <p class="footer-legal">Robust Code Inc. — Document généré via REM Engine</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useSalesStore } from '../stores/sales';
import logoRobustCode from '../assets/RobustCodelogowhite.png';

const salesStore = useSalesStore();

const salesHistory = ref([]);
const searchQuery = ref('');
const selectedStatus = ref('');
const loading = ref(false);
const itemsLoading = ref(false);
let debounceTimeout = null;

const isModalOpen = ref(false);
const selectedInvoice = ref(null);
const selectedInvoiceItems = ref([]);

// Requête synchronisée avec filtres passés en query params (identique au Core Admin)
const fetchSales = async () => {
  loading.value = true;
  try {
    const companyId = localStorage.getItem('companyId');
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/sales/documents`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      params: {
        search: searchQuery.value || undefined,
        status: selectedStatus.value || undefined,
        company_id: companyId || undefined
      }
    });
    salesHistory.value = res.data.data || res.data;
  } catch (err) {
    console.error("❌ Erreur de chargement des flux :", err);
  } finally {
    loading.value = false;
  }
};

const fetchInvoiceItems = async (documentId) => {
  itemsLoading.value = true;
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/sales/documents/${documentId}/items`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    selectedInvoiceItems.value = res.data.data || res.data;
  } catch (err) {
    console.error("❌ Erreur de mapping lignes articles :", err);
    selectedInvoiceItems.value = [];
  } finally {
    itemsLoading.value = false;
  }
};

// Gestion de la saisie utilisateur asynchrone (Debounce)
const triggerSearch = () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    fetchSales();
  }, 350);
};

const resetAndFetch = () => {
  fetchSales();
};

const openInvoice = async (sale) => {
  selectedInvoice.value = sale;
  isModalOpen.value = true;
  selectedInvoiceItems.value = [];
  await fetchInvoiceItems(sale.id);
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedInvoice.value = null;
  selectedInvoiceItems.value = [];
};

const handleCancelInvoice = async (id) => {
  if (confirm("Attention : Êtes-vous sûr de vouloir annuler cette vente ? Les stocks seront recrédités.")) {
    try {
      await salesStore.cancelInvoice(id);
      selectedInvoice.value.status = 'CANCELLED';
      await fetchSales();
    } catch (error) {
      alert("L'opération d'annulation a échoué.");
    }
  }
};

const printInvoice = () => { window.print(); };

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const whatsappLink = computed(() => {
  if (!selectedInvoice.value) return '#';
  const label = selectedInvoice.value.type === 'RESTOCK_REQUEST' ? 'Bon de Commande' : 'Reçu de vente';
  const text = encodeURIComponent(
    `Bonjour, voici le document (${label}) N° ${selectedInvoice.value.number} d'un montant global de ${Number(selectedInvoice.value.total_amount).toLocaleString()} $.`
  );
  return `https://api.whatsapp.com/send?text=${text}`;
});

const emailLink = computed(() => {
  if (!selectedInvoice.value) return '#';
  const label = selectedInvoice.value.type === 'RESTOCK_REQUEST' ? 'Restock / Approvisionnement' : 'Reçu de Vente';
  const subject = encodeURIComponent(`Document Commercial Robust Code - ${selectedInvoice.value.number}`);
  const body = encodeURIComponent(
    `Bonjour,\n\nType de flux : ${label}\nRéférence : ${selectedInvoice.value.number}\nMontant : ${Number(selectedInvoice.value.total_amount).toLocaleString()} $\nStatut actuel : ${selectedInvoice.value.status}\n\nCordialement.`
  );
  return `mailto:?subject=${subject}&body=${body}`;
});

onMounted(fetchSales);
</script>

<style scoped>
.history-module { background: #fff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: 'ABeeZee', sans-serif; }
.header-section { margin-bottom: 20px; }
.header-section h2 { font-size: 1.4rem; color: #111; font-weight: bold; margin: 0 0 4px 0; }
.subtitle { color: #64748b; font-size: 0.88rem; margin: 0; }

/* Cadre Filtre Style Industriel Clean */
.filter-zone { border: 1px solid #cbd5e1; border-radius: 6px; padding: 18px; margin-top: 20px; margin-bottom: 25px; background-color: #fafafa; }
.filter-zone legend { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 0 10px; color: #475569; letter-spacing: 0.5px; }
.filter-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
.search-box, .filter-box { display: flex; flex-direction: column; gap: 6px; }
.search-box label, .filter-box label { font-size: 0.75rem; font-weight: 600; color: #475569; }
.input-field { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.88rem; outline: none; background: #ffffff; transition: border-color 0.2s; }
.input-field:focus { border-color: #000000; }
.select-field { cursor: pointer; }

/* Tableaux de données */
.data-table { width: 100%; border-collapse: collapse; background: #fff; margin-top: 10px; font-size: 0.9rem; }
.data-table th { background: #f8fafc; color: #475569; font-weight: 600; padding: 14px; border-bottom: 2px solid #e2e8f0; text-align: left; }
.data-table td { padding: 14px; border-bottom: 1px solid #f1f5f9; }

.font-mono { font-family: monospace; }
.font-bold { font-weight: bold; }
.text-success { color: #10b981; }
.text-right { text-align: right; }
.text-center { text-align: center; }
.text-muted { color: #64748b; font-style: italic; }
.depot-tag { font-weight: normal; font-size: 0.8rem; color: #64748b; font-style: italic; margin-left: 4px; }
.depot-tag-modal { font-weight: normal; font-size: 0.9rem; color: #64748b; font-style: italic; margin-left: 6px; }

/* Badges Épurés */
.type-badge { padding: 3px 8px; border-radius: 4px; font-size: 0.68rem; font-weight: 700; background: #e2e8f0; color: #334155; letter-spacing: 0.3px; }
.type-badge.restock_request { background: #dbeafe; color: #1e40af; }

.badge { padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: bold; text-transform: uppercase; }
.badge.paid { background: #d1fae5; color: #065f46; }
.badge.draft { background: #fef3c7; color: #92400e; }
.badge.cancelled { background: #fee2e2; color: #991b1b; }

.invoice-status-inline { font-weight: bold; text-transform: uppercase; }
.invoice-status-inline.paid { color: #10b981; }
.invoice-status-inline.draft { color: #f59e0b; }
.invoice-status-inline.cancelled { color: #ef4444; }

.action-btn { background: #000000; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.8rem; transition: background 0.2s; }
.action-btn:hover { background: #222222; }

/* Overlay de la facture */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 9999; }
.modal-content { background: #f8fafc; width: 90%; max-width: 800px; max-height: 90vh; border-radius: 8px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; overflow: hidden; border: 1px solid #cbd5e1; }
.modal-actions-bar { background: #000000; padding: 12px 24px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.modal-actions-bar button, .modal-actions-bar a { padding: 8px 16px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; text-decoration: none; cursor: pointer; border: none; transition: background 0.2s; }

.btn-action-print { background: #3b82f6; color: white; }
.btn-action-print:hover { background: #2563eb; }
.btn-action-whatsapp { background: #22c55e; color: white; }
.btn-action-whatsapp:hover { background: #16a34a; }
.btn-action-email { background: #475569; color: white; }
.btn-action-email:hover { background: #334155; }
.btn-action-cancel-invoice { background: #ef4444; color: white; }
.btn-action-cancel-invoice:hover { background: #dc2626; }
.btn-action-close { background: #333333; color: white; margin-left: auto; border: 1px solid #444 !important; }

/* Feuille de Facture Épurée */
.invoice-paper { background: #ffffff; padding: 40px; overflow-y: auto; flex: 1; color: #1e293b; font-family: system-ui, sans-serif; }
.invoice-header { display: flex; justify-content: space-between; align-items: flex-start; }
.logo-container { display: flex; flex-direction: column; gap: 6px; }
.invoice-logo-img { max-width: 130px; height: auto; object-fit: contain; filter: brightness(0); }
.company-details { font-size: 0.78rem; color: #64748b; line-height: 1.4; margin: 0; }
.invoice-meta-block { text-align: right; }
.invoice-meta-block h2 { font-size: 1.3rem; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.5px; }
.invoice-meta-block p { margin: 4px 0; font-size: 0.82rem; color: #475569; }
.invoice-separator { border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0; }
.invoice-bill-to h3 { font-size: 0.75rem; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.5px; }
.client-name { font-size: 0.95rem; font-weight: 700; margin: 0 0 4px 0; color: #0f172a; }
.client-details { font-size: 0.78rem; color: #64748b; margin: 0; }

.invoice-items-table { width: 100%; border-collapse: collapse; margin-top: 24px; }
.invoice-items-table th { background: #f8fafc; padding: 10px; font-size: 0.72rem; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; letter-spacing: 0.3px; }
.invoice-items-table td { padding: 12px 10px; font-size: 0.85rem; border-bottom: 1px solid #f1f5f9; }

.invoice-total-block { width: 45%; margin-left: auto; margin-top: 24px; }
.total-row { display: flex; justify-content: space-between; font-size: 0.85rem; }
.grand-total { font-size: 1.05rem; font-weight: 800; color: #0f172a; border-top: 2px solid #000000; padding-top: 10px; }
.invoice-footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 0.8rem; border-top: 1px dashed #e2e8f0; padding-top: 20px; }
.footer-legal { font-size: 0.72rem; margin-top: 4px; }

/* Feedbacks system */
.state-feedback { text-align: center; padding: 40px; color: #64748b; font-size: 0.88rem; font-style: italic; }
.spinner { width: 16px; height: 16px; border: 2px solid #e2e8f0; border-top-color: #000000; border-radius: 50%; display: inline-block; animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 8px; }
@keyframes spin { to { transform: rotate(360deg); } }

@media print {
  .no-print, .no-print * { display: none !important; }
  .modal-overlay { position: absolute !important; background: none !important; padding: 0 !important; }
  .modal-content { box-shadow: none !important; width: 100% !important; max-width: 100% !important; border: none !important; }
  .invoice-paper { padding: 0 !important; width: 100% !important; }
}
</style>