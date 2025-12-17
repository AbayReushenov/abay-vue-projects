import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'

import { supabase } from './lib/supabase'

// Временный тест подключения
supabase.from('cards').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('❌ Ошибка подключения к Supabase:', error.message)
    } else {
      console.log('✅ Подключение к Supabase успешно! Доступно карточек:', count)
    }
  })


const app = createApp(App)

app.use(createPinia())

app.mount('#app')
