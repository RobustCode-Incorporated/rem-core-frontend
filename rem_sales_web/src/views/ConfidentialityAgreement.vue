<template>
  <div class="legal-page">
    <div class="legal-card">
      <h1>{{ $t('legal.title') }}</h1>
      <p class="muted">{{ $t('legal.lastUpdate') }}</p>
      <p>{{ $t('legal.intro') }}</p>
      <h2>{{ $t('legal.s1Title') }}</h2>
      <p>{{ $t('legal.s1') }}</p>
      <h2>{{ $t('legal.s2Title') }}</h2>
      <p>{{ $t('legal.s2') }}</p>
      <h2>{{ $t('legal.s3Title') }}</h2>
      <p>{{ $t('legal.s3') }}</p>
      <h2>{{ $t('legal.s4Title') }}</h2>
      <p>{{ $t('legal.s4') }}</p>
      <h2>{{ $t('legal.s5Title') }}</h2>
      <p>{{ $t('legal.s5') }}</p>
      <h2>{{ $t('legal.s6Title') }}</h2>
      <p>{{ $t('legal.s6') }}</p>
    </div>
  </div>
</template>

<style scoped>
.legal-page {
  min-height: 100vh;
  background: #f4f5f7;
  padding: 30px 16px;
  font-family: 'ABeeZee', sans-serif;
}

.legal-card {
  max-width: 920px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.08);
  color: #1f1f1f;
  line-height: 1.7;
}

h1 {
  margin-top: 0;
  font-size: 1.55rem;
  line-height: 1.35;
}

h2 {
  margin-top: 24px;
  margin-bottom: 8px;
  font-size: 1.05rem;
}

p {
  margin: 8px 0;
}

.muted {
  color: #6f6f6f;
  font-size: 0.92rem;
}

@media (max-width: 768px) {
  .legal-page {
    padding: 16px 10px;
  }
  .legal-card {
    padding: 18px 14px;
    border-radius: 10px;
  }
  h1 {
    font-size: 1.2rem;
  }
}
</style>