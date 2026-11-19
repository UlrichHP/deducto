import { createApp } from 'vue'
import App from './App.vue'
import { initAudio } from './audio'
import { createAppI18n } from './i18n'
import { detectLocale, persistLocale } from './i18n/locale'
import './fonts.css'
import './style.css'

const i18n = createAppI18n(detectLocale())
persistLocale(i18n.global.locale)
initAudio()

createApp(App).use(i18n).mount('#app')
