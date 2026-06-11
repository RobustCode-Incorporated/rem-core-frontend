<template>
  <div class="stats-container">
    <h2>Statistiques de mes ventes</h2>
    <div class="stats-grid">
      <div class="stat-card">Chiffre d'affaires : En cours...</div>
      <div class="stat-card">Ventes réalisées : 0</div>
    </div>
  </div>
</template>

<style scoped>
.stats-container { padding: 20px; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.stat-card { background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #eee; }
</style>