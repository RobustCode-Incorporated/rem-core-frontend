<template>
  <Transition
    enter-active-class="transform transition ease-in-out duration-300"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transform transition ease-in-out duration-300"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div v-if="isOpen" class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100">
      
      <div class="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div>
          <span class="text-xs font-bold tracking-wider text-indigo-400 uppercase">Fiche Revendeur Pro</span>
          <h2 class="text-xl font-bold truncate text-white" v-if="reseller">{{ reseller.name }}</h2>
          <p class="text-xs text-slate-400 flex items-center mt-0.5" v-if="reseller">
            <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            {{ reseller.deposit_name || 'Aucun dépôt assigné' }}
          </p>
        </div>
        <button @click="closeSidebar" class="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
          ✕
        </button>
      </div>

      <div v-if="loading" class="flex-1 flex flex-col items-center justify-center p-6 space-y-3">
        <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-sm text-slate-400 font-medium">Agrégation des données réelles Neon...</p>
      </div>

      <div v-else class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/50">
        
        <div class="space-y-3 p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center">
          <h3 class="text-xs font-semibold tracking-wide text-slate-400 uppercase self-start w-full mb-2">Répartition du Pipe Local</h3>
          
          <div class="relative w-40 h-40">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" stroke-width="6"></circle>
              
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" stroke-width="6"
                :stroke-dasharray="`${donutSegments.paid} ${100 - donutSegments.paid}`"
                stroke-dashoffset="0">
              </circle>
              
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" stroke-width="6"
                :stroke-dasharray="`${donutSegments.draft} ${100 - donutSegments.draft}`"
                :stroke-dashoffset="`-${donutSegments.paid}`">
              </circle>

              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f43f5e" stroke-width="6"
                :stroke-dasharray="`${donutSegments.cancelled} ${100 - donutSegments.cancelled}`"
                :stroke-dashoffset="`-${donutSegments.paid + donutSegments.draft}`">
              </circle>
            </svg>
            
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-xxs uppercase tracking-widest text-slate-400 font-medium">Total</span>
              <span class="text-sm font-black text-white">{{ formatCurrency(totalRevenueAll) }}</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 w-full text-center text-xxs font-semibold pt-2 border-t border-slate-900">
            <div class="text-emerald-400">● PAID ({{ Math.round(donutSegments.paid) }}%)</div>
            <div class="text-amber-400">● DRAFT ({{ Math.round(donutSegments.draft) }}%)</div>
            <div class="text-rose-400">● CANCEL ({{ Math.round(donutSegments.cancelled) }}%)</div>
          </div>
        </div>

        <div class="space-y-3">
          <div class="p-4 bg-slate-950 border border-slate-800/80 rounded-xl">
            <p class="text-xs text-slate-400 font-medium">Chiffre d'Affaires Encaissé (PAID)</p>
            <p class="text-2xl font-black text-emerald-400 mt-1">
              {{ formatCurrency(getFinancialStat('PAID')?.total_revenue) }}
            </p>
            <div class="text-xs text-slate-500 mt-2">
              Basé sur <span class="text-slate-300 font-semibold">{{ getFinancialStat('PAID')?.total_invoices || 0 }}</span> factures acquittées.
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-slate-950/60 border border-slate-800/50 rounded-xl">
              <p class="text-[11px] text-slate-400 font-medium">Pipe (DRAFT)</p>
              <p class="text-base font-bold text-amber-400 mt-0.5">
                {{ formatCurrency(getFinancialStat('DRAFT')?.total_revenue) }}
              </p>
            </div>
            <div class="p-3 bg-slate-950/60 border border-slate-800/50 rounded-xl">
              <p class="text-[11px] text-slate-400 font-medium">Annulations</p>
              <p class="text-base font-bold text-rose-500 mt-0.5">
                {{ formatCurrency(getFinancialStat('CANCELLED')?.total_revenue) }}
              </p>
            </div>
          </div>
        </div>

        <hr class="border-slate-800" />

        <div class="space-y-3">
          <h3 class="text-sm font-semibold tracking-wide text-slate-400 uppercase">Top Produits Stars</h3>
          <div class="space-y-2.5">
            <div v-for="(product, index) in topProducts" :key="product.sku" class="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div class="flex items-center space-x-3 min-w-0">
                <div class="w-7 h-7 rounded-lg bg-slate-850 flex items-center justify-center text-xs font-bold text-indigo-400 border border-slate-800 shrink-0">#{{ index + 1 }}</div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-white truncate">{{ product.product_name }}</p>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="text-xs font-bold text-slate-200">{{ product.units_sold }} u</p>
                <p class="text-[11px] text-emerald-500">{{ formatCurrency(product.generated_revenue) }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({ resellerId: { type: String, default: null } });
const emit = defineEmits(['close']);

const isOpen = ref(false);
const loading = ref(false);
const reseller = ref(null);
const financials = ref([]);
const topProducts = ref([]);

watch(() => props.resellerId, async (newId) => {
  if (newId) {
    isOpen.value = true;
    await fetchResellerPerformance(newId);
  } else {
    isOpen.value = false;
  }
});

const fetchResellerPerformance = async (id) => {
  loading.value = true;
  try {
    const companyId = localStorage.getItem('companyId') || '943e411e-9c4c-484f-9dde-9db708f5159a';
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const response = await fetch(`${baseUrl}/sales/resellers/${id}/performance?company_id=${companyId}`);
    const result = await response.json();

    if (result.success) {
      reseller.value = result.reseller;
      financials.value = result.analytics.financials;
      topProducts.value = result.analytics.topProducts;
    }
  } catch (error) {
    console.error("❌ Échec d'affichage de l'analytics revendeur :", error);
  } finally {
    loading.value = false;
  }
};

// CALCUL DYNAMIQUE DU TOTAL ET DES PARTS DU DONUT
const totalRevenueAll = computed(() => {
  return financials.value.reduce((acc, curr) => acc + Number(curr.total_revenue || 0), 0);
});

const donutSegments = computed(() => {
  const total = totalRevenueAll.value;
  if (!total) return { paid: 0, draft: 0, cancelled: 0 };
  
  const getVal = (status) => Number(financials.value.find(f => f.status === status)?.total_revenue || 0);
  return {
    paid: (getVal('PAID') / total) * 100,
    draft: (getVal('DRAFT') / total) * 100,
    cancelled: (getVal('CANCELLED') / total) * 100
  };
});

const getFinancialStat = (status) => financials.value.find(stat => stat.status === status);
const closeSidebar = () => { isOpen.value = false; emit('close'); };

const formatCurrency = (value) => {
  if (!value) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value));
};
</script>

<style scoped>
.text-xxs { font-size: 0.65rem; }
</style>