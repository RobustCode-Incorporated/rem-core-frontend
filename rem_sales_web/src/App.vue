<template>
  <div class="app-shell">
    <div class="lang-switcher">
      <button @click="setLocale('fr')" :class="{ active: currentLocale === 'fr' }">FR</button>
      <button @click="setLocale('en')" :class="{ active: currentLocale === 'en' }">EN</button>
    </div>
    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from './i18n'

const { locale } = useI18n()
const currentLocale = computed(() => locale.value)
</script>

<style>
:root {
  --bg-main: #FFFAFA;
}
* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
body { background-color: var(--bg-main); }
.app-shell { min-height: 100vh; }
.lang-switcher { display: flex; justify-content: flex-end; gap: 8px; padding: 10px 16px; background: #fff; border-bottom: 1px solid #eee; }
.lang-switcher button { border: 1px solid #ccc; background: #fff; padding: 6px 10px; border-radius: 6px; cursor: pointer; }
.lang-switcher button.active { background: #000; color: #fff; border-color: #000; }
</style>
