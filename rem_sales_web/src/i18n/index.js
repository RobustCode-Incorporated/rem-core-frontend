import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'

const savedLocale = typeof window !== 'undefined' ? (localStorage.getItem('app-locale') || 'fr') : 'fr'

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'fr',
  messages: {
    fr,
    en
  }
})

export const setLocale = (locale) => {
  i18n.global.locale.value = locale
  if (typeof window !== 'undefined') {
    localStorage.setItem('app-locale', locale)
  }
}
