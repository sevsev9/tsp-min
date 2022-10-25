import { createApp } from 'vue'
import App from './App.vue'
import { Quasar } from 'quasar'
import quasarUserOptions from './quasar-user-options'
import { createPinia } from 'pinia'

createApp(App).use(createPinia()).use(Quasar, quasarUserOptions).mount('#app')
