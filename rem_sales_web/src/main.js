import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router' // Importe bien le dossier router (qui contient ton index.js)

const app = createApp(App)

app.use(createPinia())
app.use(router) // 👈 C'EST CETTE LIGNE QUI MANQUE OU QUI EST MAL PLACÉE

app.mount('#app')