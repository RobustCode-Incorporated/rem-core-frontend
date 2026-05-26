<template>
  <!-- RouterView affiche dynamiquement le composant selon l'URL (Login, Register ou Dashboard) -->
  <router-view />
</template>

<style>
/* Garde tes styles globaux ici (fonts, reset css) */
:root {
  --bg-main: #FFFAFA; /* Blanc neige */
}
* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
body { background-color: var(--bg-main); }
</style>