import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { GAME_TITLE } from '@route'

document.title = GAME_TITLE

createApp(App).mount('#app')
