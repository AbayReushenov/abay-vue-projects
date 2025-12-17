import { createClient } from '@supabase/supabase-js'

// 1. Считываем переменные из .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log(supabaseUrl)
console.log(supabaseAnonKey)

// Простая проверка, чтобы не ломать голову, если забыл создать .env
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Отсутствуют VITE_SUPABASE_URL или VITE_SUPABASE_ANON_KEY в файле .env')
}

// 2. Создаем и экспортируем единственный экземпляр клиента
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
