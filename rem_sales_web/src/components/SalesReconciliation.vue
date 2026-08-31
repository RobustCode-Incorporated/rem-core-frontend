<template>
  <div class="sales-module-container">
    
    <fieldset class="filter-zone no-print">
      <legend>{{ $t('sales.legend') }}</legend>
      <div class="filter-grid">
        <div class="search-box">
          <label for="search-input">{{ $t('sales.searchLabel') }}</label>
          <input 
            id="search-input"
            v-model="searchQuery" 
            @input="triggerSearch"
            type="text" 
            :placeholder="$t('sales.searchPlaceholder')"
            class="input-field"
          />
        </div>

        <div class="filter-box">
          <label for="status-select">{{ $t('sales.statusLabel') }}</label>
          <select id="status-select" v-model="selectedStatus" @change="resetAndFetch" class="input-field select-field">
            <option value="">{{ $t('sales.allStatuses') }}</option>
            <option value="PAID">{{ $t('sales.paid') }}</option>
            <option value="DRAFT">{{ $t('sales.draft') }}</option>
            <option value="CANCELLED">{{ $t('sales.cancelled') }}</option>
          </select>
        </div>
      </div>
    </fieldset>

    <div class="results-meta no-print" v-if="metaData">
      <p><strong>{{ metaData.totalItems }}</strong> {{ $t('sales.found') }}</p>
    </div>

    <div class="table-wrapper" :class="{ 'no-print': isModalOpen }">
      <div v-if="loading" class="state-feedback loading-state">
        {{ $t('sales.loadingData') }}
      </div>
      
      <div v-else-if="salesList.length === 0" class="state-feedback empty-state">
        {{ $t('sales.noResult') }}
      </div>

      <table v-else class="sales-table">
        <thead>
          <tr>
            <th>{{ $t('sales.colInvoice') }}</th>
            <th>{{ $t('sales.colType') }}</th>
            <th>{{ $t('sales.colBeneficiary') }}</th>
            <th>{{ $t('sales.colDate') }}</th>
            <th class="text-left">{{ $t('sales.colAmount') }}</th>
            <th>{{ $t('sales.colStatus') }}</th>
            <th>{{ $t('sales.colActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sale in salesList" :key="sale.id">
            <td class="font-mono font-bold">{{ sale.number }}</td>
            <td>
              <span :class="['type-badge', sale.type?.toLowerCase()]">
                {{ sale.type === 'RESTOCK_REQUEST' ? '📦 ' + $t('sales.typeRestock') : '💼 ' + $t('sales.typeSale') }}
              </span>
            </td>
            <td class="font-bold">
              {{ sale.client_name || sale.reseller_name }}
              <span v-if="sale.depot_name" class="depot-tag">
                ({{ sale.depot_name }})
              </span>
            </td>
            <td>{{ formatDate(sale.created_at) }}</td>
            <td class="text-left font-bold">{{ Number(sale.total_amount).toLocaleString() }} $</td>
            <td>
              <span :class="['badge', sale.status.toLowerCase()]">
                {{ sale.status }}
              </span>
            </td>
            <td>
              <button @click="openInvoice(sale)" class="action-btn btn-view" :title="$t('common.consult')">{{ $t('common.consult') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-bar no-print" v-if="metaData && metaData.totalPages > 1">
      <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1" class="pag-btn">{{ $t('common.previous') }}</button>
      <span class="page-indicator">{{ $t('common.page') }} <strong>{{ currentPage }}</strong> {{ $t('common.of') }} <strong>{{ metaData.totalPages }}</strong></span>
      <button @click="changePage(currentPage + 1)" :disabled="currentPage === metaData.totalPages" class="pag-btn">{{ $t('common.next') }}</button>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        
        <div class="modal-actions-bar no-print">
          <button @click="printInvoice" class="btn-action-print">🖨️ Imprimer / PDF</button>
          <button @click="sendViaWhatsapp" class="btn-action-whatsapp" :disabled="isGeneratingPdf">💬 {{ isGeneratingPdf ? 'Génération...' : 'WhatsApp' }}</button>
          <button @click="sendViaEmail" class="btn-action-email" :disabled="isGeneratingPdf">✉️ {{ isGeneratingPdf ? 'Génération...' : 'Email' }}</button>
          
          <button 
            v-if="selectedInvoice.status === 'DRAFT' && userRole !== 'STAFF'" 
            @click="handleCollectPayment(selectedInvoice.id)" 
            class="btn-action-collect"
          >
            💵 Encaisser la facture
          </button>
          
          <button 
            v-if="(selectedInvoice.status === 'DRAFT' || selectedInvoice.status === 'PAID') && userRole !== 'STAFF'" 
            @click="handleCancelInvoice(selectedInvoice.id)" 
            class="btn-action-cancel-invoice"
          >
            ❌ Annuler
          </button>

          <button @click="closeModal" class="btn-action-close">Fermer ✕</button>
        </div>

        <div class="invoice-paper" ref="invoicePaperRef">
          <div class="invoice-header">
            <div class="logo-container">
              <img :src="logoRobustCode" alt="Robust Code Inc. Logo" class="invoice-logo-img" />
              <p class="company-details">Solutions Technologiques Multi-tenant<br>Bruxelles, Belgique</p>
            </div>
            <div class="invoice-meta-block">
              <h2>{{ selectedInvoice.type === 'RESTOCK_REQUEST' ? $t('invoice.purchaseOrder') : $t('invoice.invoice') }}</h2>
              <p><strong>{{ $t('invoice.number') }}</strong> {{ selectedInvoice.number }}</p>
              <p><strong>{{ $t('invoice.date') }}</strong> {{ formatDate(selectedInvoice.created_at) }}</p>
              <p><strong>{{ $t('invoice.status') }}</strong> <span :class="['invoice-status-inline', selectedInvoice.status.toLowerCase()]">{{ selectedInvoice.status }}</span></p>
            </div>
          </div>

          <hr class="invoice-separator" />

          <div class="invoice-bill-to">
            <h3>{{ selectedInvoice.type === 'RESTOCK_REQUEST' ? $t('invoice.requestingDepot') : $t('invoice.billedTo') }}</h3>
            <p class="client-name">
              {{ selectedInvoice.client_name || selectedInvoice.reseller_name }}
              <span v-if="selectedInvoice.depot_name" class="depot-tag-modal">
                ({{ selectedInvoice.depot_name }})
              </span>
            </p>
            <p class="client-details">{{ $t('invoice.accountId') }} {{ selectedInvoice.reseller_id || selectedInvoice.client_id || 'N/A' }}</p>
          </div>

          <table class="invoice-items-table">
            <thead>
              <tr>
                <th>{{ $t('invoice.productDesc') }}</th>
                <th class="text-right">{{ $t('invoice.qty') }}</th>
                <th class="text-right">{{ $t('invoice.unitPrice') }}</th>
                <th class="text-right">{{ $t('invoice.total') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in selectedInvoiceItems" :key="item.id">
                <td>{{ item.product_name || $t('invoice.restockedProduct') }}</td>
                <td class="text-right">{{ item.quantity }}</td>
                <td class="text-right">{{ Number(item.unit_price).toLocaleString() }} $</td>
                <td class="text-right font-bold">{{ Number(item.total_price).toLocaleString() }} $</td>
              </tr>
              <tr v-if="itemsLoading">
                <td colspan="4" class="text-center text-muted">🔄 {{ $t('invoice.loadingItems') }}</td>
              </tr>
              <tr v-else-if="selectedInvoiceItems.length === 0">
                <td colspan="4" class="text-center text-muted">⚠️ {{ $t('invoice.noItems') }}</td>
              </tr>
            </tbody>
          </table>

          <div class="invoice-total-block">
            <div class="total-row">
              <span>{{ $t('invoice.netAmount') }}</span>
              <span>{{ Number(selectedInvoice.total_amount).toLocaleString() }} $</span>
            </div>
            <div class="total-row">
              <span>{{ $t('invoice.vat') }}</span>
              <span>0 $</span>
            </div>
            <div class="total-row grand-total">
              <span>{{ $t('invoice.grandTotal') }}</span>
              <span>{{ Number(selectedInvoice.total_amount).toLocaleString() }} $</span>
            </div>
          </div>

          <div class="invoice-footer">
            <p>{{ $t('invoice.thankYou') }}</p>
            <p class="footer-legal">{{ $t('invoice.generatedBy') }}</p>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useSalesStore } from '../stores/sales'

import logoRobustCode from '../assets/RobustCodelogowhite.png'

// ⚡ Définition des propriétés d'injection pour le filtrage par contexte d'onglet
const props = defineProps({
  defaultType: {
    type: String,
    default: '' // 'SALE' ou 'RESTOCK_REQUEST' ou vide pour tout charger
  }
})

const salesStore = useSalesStore()

// 🛡️ Récupération dynamique et réactive du rôle utilisateur depuis le stockage local
const userRole = computed(() => localStorage.getItem('userRole') || '')

const salesList = ref([])
const metaData = ref(null)
const currentPage = ref(1)
const searchQuery = ref('')
const selectedStatus = ref('')
const loading = ref(false)
const itemsLoading = ref(false)
let debounceTimeout = null

const isModalOpen = ref(false)
const selectedInvoice = ref(null)
const selectedInvoiceItems = ref([])
const invoicePaperRef = ref(null)
const isGeneratingPdf = ref(false)

// 🔄 Forcer la réinitialisation de la pagination et le rechargement si l'onglet change
watch(() => props.defaultType, () => {
  currentPage.value = 1
  fetchPaginatingSales()
})

const fetchPaginatingSales = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const urlParams = new URLSearchParams(window.location.search)
    const companyId = urlParams.get('company_id') || localStorage.getItem('companyId') || '943e411e-9c4c-484f-9dde-9db708f5159a'

    const response = await axios.get(`${import.meta.env.VITE_API_URL}/sales/documents`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: currentPage.value,
        limit: 15,
        search: searchQuery.value,
        status: selectedStatus.value,
        company_id: companyId,
        type: props.defaultType || undefined // Envoi du filtre type à l'API
      }
    })

    const rawData = response.data.data || response.data
    
    // Double sécurité : Filtrage côté client si l'API ne supporte pas le paramètre type
    if (props.defaultType) {
      salesList.value = rawData.filter(d => d.type === props.defaultType)
    } else {
      salesList.value = rawData
    }

    metaData.value = response.data.meta
  } catch (error) {
    console.error("❌ [UX ERROR] Échec de la récupération des ventes paginées:", error)
  } finally {
    loading.value = false
  }
}

// 🟢 FONCTION DE TRAITEMENT DU PAIEMENT ENCAISSÉ
const handleCollectPayment = async (id) => {
  try {
    await salesStore.collectPayment(id)
    selectedInvoice.value.status = 'PAID' // Mutation réactive locale instantanée
    await fetchPaginatingSales() // Synchronisation asynchrone du tableau global
    alert("Succès : Le paiement a été enregistré et les stocks ont été mis à jour.")
  } catch (error) {
    alert("Une erreur est survenue lors de la tentative d'encaissement de la facture.")
  }
}

// 🔴 FONCTION D'ANNULATION DU DOCUMENT DE VENTE
const handleCancelInvoice = async (id) => {
  if (confirm("Attention : Êtes-vous sûr de vouloir annuler ce document commercial ? Les stocks correspondants seront recalculés.")) {
    try {
      await salesStore.cancelInvoice(id)
      selectedInvoice.value.status = 'CANCELLED' // Mutation réactive locale instantanée
      await fetchPaginatingSales() // Synchronisation asynchrone du tableau global
      alert("Le document a été annulé avec succès.")
    } catch (error) {
      alert("Une erreur est survenue lors de l'annulation du document.")
    }
  }
}

const fetchInvoiceItems = async (documentId) => {
  itemsLoading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/sales/documents/${documentId}/items`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    selectedInvoiceItems.value = response.data.data || response.data
  } catch (error) {
    console.error("❌ Impossible de charger les articles du document:", error)
    selectedInvoiceItems.value = []
  } finally {
    itemsLoading.value = false
  }
}

const triggerSearch = () => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchPaginatingSales()
  }, 350)
}

const resetAndFetch = () => {
  currentPage.value = 1
  fetchPaginatingSales()
}

const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= metaData.value.totalPages) {
    currentPage.value = newPage
    fetchPaginatingSales()
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const openInvoice = async (sale) => {
  selectedInvoice.value = sale
  isModalOpen.value = true
  selectedInvoiceItems.value = []
  await fetchInvoiceItems(sale.id)
}

const closeModal = () => {
  isModalOpen.value = false
  selectedInvoice.value = null
  selectedInvoiceItems.value = []
}

const printInvoice = () => {
  window.print()
}

// 📄 Génère un PDF de la facture affichée à partir du rendu HTML de la modale
const generateInvoicePdf = async () => {
  const element = invoicePaperRef.value
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  return pdf
}

// 💬 Partage la facture au format PDF via WhatsApp (partage natif fichier, ou repli téléchargement)
const sendViaWhatsapp = async () => {
  if (!selectedInvoice.value || isGeneratingPdf.value) return
  isGeneratingPdf.value = true
  try {
    const pdf = await generateInvoicePdf()
    const fileName = `Facture_${selectedInvoice.value.number}.pdf`
    const text = `Bonjour, voici votre document ${selectedInvoice.value.number} d'un montant de ${Number(selectedInvoice.value.total_amount).toLocaleString()} $.`
    const file = new File([pdf.output('blob')], fileName, { type: 'application/pdf' })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text, title: fileName })
    } else {
      pdf.save(fileName)
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n\n(Le PDF de la facture a été téléchargé, veuillez le joindre à ce message.)')}`, '_blank')
    }
  } catch (error) {
    console.error("❌ Échec de l'envoi de la facture PDF via WhatsApp:", error)
    if (error?.name !== 'AbortError') {
      alert("Une erreur est survenue lors de la génération du PDF de la facture.")
    }
  } finally {
    isGeneratingPdf.value = false
  }
}

// ✉️ Partage la facture au format PDF par email (partage natif fichier, ou repli téléchargement)
const sendViaEmail = async () => {
  if (!selectedInvoice.value || isGeneratingPdf.value) return
  isGeneratingPdf.value = true
  try {
    const pdf = await generateInvoicePdf()
    const fileName = `Facture_${selectedInvoice.value.number}.pdf`
    const subject = `Document Robust Code Inc. - N° ${selectedInvoice.value.number}`
    const body = `Bonjour,\n\nVeuillez trouver ci-joint le document ${selectedInvoice.value.number}.\nMontant total : ${Number(selectedInvoice.value.total_amount).toLocaleString()} $\nStatut : ${selectedInvoice.value.status}\n\nCordialement,`
    const file = new File([pdf.output('blob')], fileName, { type: 'application/pdf' })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: body, title: subject })
    } else {
      pdf.save(fileName)
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + '\n\n(Le PDF de la facture a été téléchargé, veuillez le joindre à cet email.)')}`
    }
  } catch (error) {
    console.error("❌ Échec de l'envoi de la facture PDF par email:", error)
    if (error?.name !== 'AbortError') {
      alert("Une erreur est survenue lors de la génération du PDF de la facture.")
    }
  } finally {
    isGeneratingPdf.value = false
  }
}

onMounted(() => {
  fetchPaginatingSales()
})
</script>

<style scoped>
.depot-tag { font-weight: normal; font-size: 0.8rem; color: #64748b; font-style: italic; margin-left: 6px; }
.depot-tag-modal { font-weight: normal; font-size: 0.95rem; color: #64748b; font-style: italic; margin-left: 6px; }

.sales-module-container { background: #fff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.filter-zone { border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin-bottom: 20px; }
.filter-zone legend { font-size: 0.8rem; font-weight: bold; text-transform: uppercase; padding: 0 8px; }
.filter-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
.search-box, .filter-box { display: flex; flex-direction: column; gap: 6px; }
.search-box label, .filter-box label { font-size: 0.75rem; font-weight: 600; color: #475569; }
.input-field { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem; outline: none; }
.input-field:focus { border-color: #000; }
.select-field { cursor: pointer; }
.results-meta { font-size: 0.85rem; color: #64748b; margin-bottom: 12px; }
.table-wrapper { overflow-x: auto; min-height: 200px; }
.sales-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
.sales-table th { background: #f8fafc; color: #475569; font-weight: 600; padding: 12px; border-bottom: 2px solid #e2e8f0; }
.sales-table td { padding: 12px; border-bottom: 1px solid #edf2f7; color: #1e293b; }
.font-mono { font-family: monospace; }
.font-bold { font-weight: bold; }
.text-right { text-align: right; }
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-muted { color: #64748b; font-style: italic; }

.badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
.badge.paid { background: #d1fae5; color: #065f46; }
.badge.draft { background: #fef3c7; color: #92400e; }
.badge.cancelled { background: #fee2e2; color: #991b1b; }

.invoice-status-inline { font-weight: bold; text-transform: uppercase; }
.invoice-status-inline.paid { color: #10b981; }
.invoice-status-inline.draft { color: #f59e0b; }
.invoice-status-inline.cancelled { color: #ef4444; }

.type-badge { padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; background: #e2e8f0; color: #334155; }
.type-badge.restock_request { background: #dbeafe; color: #1e40af; }

.action-btn { background: #f8fafc; border: 1px solid #cbd5e1; cursor: pointer; font-size: 0.8rem; font-weight: 600; color: #0f172a; padding: 6px 10px; border-radius: 4px; }
.action-btn:hover { background: #e2e8f0; }
.state-feedback { text-align: center; padding: 40px; color: #64748b; }
.pagination-bar { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
.pag-btn { background: #000; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
.pag-btn:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; }
.page-indicator { font-size: 0.85rem; color: #334155; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 9999; }
.modal-content { background: #f8fafc; width: 90%; max-width: 850px; max-height: 90vh; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; overflow: hidden; }
.modal-actions-bar { background: #1e293b; padding: 12px 24px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.modal-actions-bar button, .modal-actions-bar a { padding: 8px 16px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; text-decoration: none; cursor: pointer; border: none; transition: background 0.2s ease; }
.modal-actions-bar button:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-action-print { background: #3b82f6; color: white; }
.btn-action-print:hover { background: #2563eb; }
.btn-action-whatsapp { background: #22c55e; color: white; }
.btn-action-whatsapp:hover { background: #16a34a; }
.btn-action-email { background: #64748b; color: white; }
.btn-action-email:hover { background: #475569; }

.btn-action-collect { background: #10b981; color: white; }
.btn-action-collect:hover { background: #059669; }
.btn-action-cancel-invoice { background: #f97316; color: white; }
.btn-action-cancel-invoice:hover { background: #ea580c; }

.btn-action-close { background: #ef4444; color: white; margin-left: auto; }
.btn-action-close:hover { background: #dc2626; }

.invoice-paper { background: #ffffff; padding: 40px; overflow-y: auto; flex: 1; color: #1e293b; font-family: 'Segoe UI', system-ui, sans-serif; }
.invoice-header { display: flex; justify-content: space-between; align-items: flex-start; }
.logo-container { display: flex; flex-direction: column; gap: 8px; }
.invoice-logo-img { max-width: 180px; height: auto; object-fit: contain; filter: brightness(0) contrast(100%); }
.company-details { font-size: 0.85rem; color: #64748b; line-height: 1.4; margin: 0; }
.invoice-meta-block { text-align: right; }
.invoice-meta-block h2 { font-size: 1.6rem; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
.invoice-meta-block p { margin: 4px 0; font-size: 0.9rem; color: #475569; }
.invoice-separator { border: 0; border-top: 2px solid #f1f5f9; margin: 24px 0; }
.invoice-bill-to h3 { font-size: 0.85rem; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.5px; }
.client-name { font-size: 1.1rem; font-weight: 700; margin: 0 0 4px 0; color: #0f172a; }
.client-details { font-size: 0.85rem; color: #64748b; margin: 0; }
.invoice-items-table { width: 100%; border-collapse: collapse; margin-top: 32px; }
.invoice-items-table th { background: #f8fafc; padding: 10px 12px; font-size: 0.8rem; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #cbd5e1; }
.invoice-items-table td { padding: 16px 12px; font-size: 0.95rem; border-bottom: 1px solid #f1f5f9; }
.invoice-total-block { width: 40%; margin-left: auto; margin-top: 24px; display: flex; flex-direction: column; gap: 8px; }
.total-row { display: flex; justify-content: space-between; font-size: 0.9rem; color: #475569; }
.grand-total { font-size: 1.1rem; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 4px; }
.invoice-footer { margin-top: 60px; text-align: center; color: #94a3b8; }
.invoice-footer p { margin: 4px 0; font-size: 0.9rem; }
.footer-legal { font-size: 0.75rem !important; margin-top: 12px !important; }

@media (max-width: 900px) {
  .sales-module-container {
    padding: 14px;
  }
  .filter-grid {
    grid-template-columns: 1fr;
  }
  .sales-table {
    min-width: 920px;
  }
  .modal-content {
    width: 96%;
  }
  .invoice-paper {
    padding: 16px;
  }
  .invoice-header {
    flex-direction: column;
    gap: 12px;
  }
  .invoice-meta-block {
    text-align: left;
  }
  .invoice-total-block {
    width: 100%;
  }
}

@media print {
  .no-print, .no-print * { display: none !important; }
  .modal-overlay { position: absolute !important; background: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; }
  .modal-content { box-shadow: none !important; width: 100% !important; max-width: 100% !important; background: transparent !important; }
  .invoice-paper { padding: 0 !important; margin: 0 !important; width: 100% !important; }
  .invoice-logo-img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>