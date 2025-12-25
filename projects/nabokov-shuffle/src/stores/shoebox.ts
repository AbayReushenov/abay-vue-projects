import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'
import type { Card, CardColor } from '../types'

export const useShoeboxStore = defineStore('shoebox', () => {
  // --- STATE ---
  const cards = ref<Card[]>([])
  const loading = ref(false)

  // Нам нужен authStore для получения user.id
  const authStore = useAuthStore()

  // --- GETTERS ---
  // Вернули ваш счетчик слов
  const totalWordCount = computed(() => {
    return cards.value.reduce((acc, card) => {
      return acc + (card.content.trim() ? card.content.trim().split(/\s+/).length : 0)
    }, 0)
  })

  // --- ACTIONS ---

  // 1. Загрузка (READ)
  const fetchCards = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        // .order('created_at', { ascending: false }) // Новые сверху
        .order('order', { ascending: true }) // <--- Сортируем по порядку!

      if (error) throw error
      if (data) {
        cards.value = data as Card[]
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error)
    } finally {
      loading.value = false
    }
  }

  // 2. Добавление (CREATE)
  const addCard = async (content: string = '', color: CardColor = 'default') => {
    if (!authStore.user) return

    // Ищем текущий МИНИМАЛЬНЫЙ order среди всех карточек
    // Если карточек нет, начинаем с 0
    const currentMinOrder = cards.value.length > 0
      ? Math.min(...cards.value.map(c => c.order))
      : 0

    // Формируем объект для БД. ID создаст сама база.
    const payload = {
      content,
      color,
      user_id: authStore.user.id,
      order: currentMinOrder - 1
    }

    try {
      const { data, error } = await supabase
        .from('cards')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      if (data) {
        // Добавляем в начало массива (как unshift)
        cards.value.unshift(data as Card)
      }
    } catch (error) {
      console.error('Ошибка создания:', error)
    }
  }

  // 3. Удаление (DELETE)
  const deleteCard = async (id: string) => {
    // Оптимистичное обновление: удаляем из UI сразу, чтобы была красивая анимация
    const originalCards = [...cards.value]
    cards.value = cards.value.filter(c => c.id !== id)

    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id)

      if (error) {
        // Если ошибка — возвращаем карточку назад
        cards.value = originalCards
        throw error
      }
    } catch (error) {
      console.error('Ошибка удаления:', error)
    }
  }

  // 4. Обновление (UPDATE)
  const updateCardContent = async (id: string, content: string) => {
    const card = cards.value.find(c => c.id === id)
    if (card) {
      card.content = content
      // Debounce (отложенная отправка) лучше делать в компоненте,
      // но здесь отправим сразу для простоты
      try {
        const { error } = await supabase
          .from('cards')
          .update({ content })
          .eq('id', id)

        if (error) throw error
      } catch (error) {
        console.error('Ошибка обновления:', error)
      }
    }
  }

  // Сохранение порядка на сервере
  const persistOrder = async () => {
    if (!authStore.user) return

    // Подготовка данных для массового обновления (Upsert)
    // Мы берем текущий порядок в массиве и присваиваем индексы
    const updates = cards.value.map((card, index) => ({
      id: card.id,
      user_id: authStore.user!.id, // RLS требует указания владельца при upsert
      content: card.content,       // Upsert требует обязательных полей, если они not null
      color: card.color,           // (зависит от настроек базы, часто нужен полный объект)
      order: index                 // <--- Вот наш новый порядок!
    }))

    // Оптимизация: Supabase upsert обновляет данные, если ID совпадает
    try {
      const { error } = await supabase
        .from('cards')
        .upsert(updates) // Отправляем пачкой

      if (error) throw error
    } catch (error) {
      console.error('Ошибка сохранения порядка:', error)
    }
  }

  // 5. Перемешивание (SHUFFLE) - Чисто клиентская функция
  // ИЗМЕНЕНИЕ: Вызов persistOrder после шафла
  const shuffleCards = async () => {
    // 1. Создаем копию массива, чтобы не мутировать Proxy на каждом шаге цикла
    // Это важно для производительности и избежания глюков реактивности
    const shuffled = [...cards.value]

    let currentIndex = shuffled.length
    let randomIndex: number

    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex--

      // Классический обмен через временную переменную (самый безопасный способ)
      const temp = shuffled[currentIndex]
      shuffled[currentIndex] = shuffled[randomIndex]!
      shuffled[randomIndex] = temp!
    }

    // Присваиваем новые индексы order прямо в объектах перед сохранением в стейт
    shuffled.forEach((card, index) => {
      card.order = index
    })

    // 2. Присваиваем уже перемешанный массив обратно в реактивную переменную
    cards.value = shuffled

    // Сохраняем в базу!
    await persistOrder()
  }


  return {
    cards,
    loading,
    totalWordCount,
    persistOrder,
    fetchCards,
    addCard,
    deleteCard,
    updateCardContent,
    shuffleCards
  }
})
