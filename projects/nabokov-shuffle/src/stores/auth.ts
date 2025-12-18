import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)

  // --- Actions ---

  // 1. Инициализация (слушаем события Supabase)
  const initialize = async () => {
    // Получаем текущую сессию при старте (если есть в localStorage)
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      session.value = data.session
      user.value = data.session.user
    }

    // Подписываемся на изменения (Вход, Выход, Refresh токена)
    supabase.auth.onAuthStateChange((_event, _session) => {
      session.value = _session
      user.value = _session?.user || null
    })
  }

  // 2. Вход по Magic Link
  const signIn = async (email: string) => {
    try {
      loading.value = true
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Важно: куда перенаправить пользователя после клика по ссылке
          // Для локальной разработки это localhost
          emailRedirectTo: window.location.origin
        }
      })
      if (error) throw error
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 3. Выход
  const signOut = async () => {
    await supabase.auth.signOut()
    user.value = null
    session.value = null
  }

  return {
    user,
    session,
    loading,
    initialize,
    signIn,
    signOut
  }
})
