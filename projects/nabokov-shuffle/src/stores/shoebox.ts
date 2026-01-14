import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'
import type { Card, CardColor, SortMode } from '../types'

export const useShoeboxStore = defineStore('shoebox', () => {
  // --- STATE ---
  const cards = ref<Card[]>([])  // Храним ВСЕ карточки (и активные, и архивные)
  const loading = ref(false)
  const sortMode = ref<SortMode>('custom') // <--- По умолчанию "По порядку"
  const showArchived = ref(false)  // Режим просмотра: false = смотрим стол, true = смотрим архив

  // НОВЫЕ ПОЛЯ STATE ДЛЯ ПОИСКА И ФИЛЬТРАЦИИ ПО ЦВЕТУ
  const searchQuery = ref('')
  const selectedColors = ref<CardColor[]>([]) // Если пусто - значит все цвета

  // Нам нужен authStore для получения user.id
  const authStore = useAuthStore()

  // --- GETTERS ---
  // 1. Активные карточки (для Стола)
  const activeCards = computed(() => {
    return cards.value.filter(c => !c.is_archived)
  })

  // 2. Архивные карточки (для Корзины)
  const archivedCards = computed(() => {
    return cards.value.filter(c => c.is_archived)
  })

  // 3. (ИЗМЕНЕНО) Фильтрованные активные карточки
  // Это промежуточный геттер: берет activeCards и накладывает фильтры
  const filteredActiveCards = computed(() => {
    let result = activeCards.value

    // Фильтр по тексту
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(c => c.content.toLowerCase().includes(query))
    }

    // Фильтр по цветам
    if (selectedColors.value.length > 0) {
      result = result.filter(c => selectedColors.value.includes(c.color))
    }

    return result
  })

  // 4. (ИЗМЕНЕНО) Текущие отображаемые
  const displayedCards = computed(() => {
    // В архиве поиск пока не делаем, для простоты пока без фильтров в архиве
    if (showArchived.value) {
      return archivedCards.value
    }
    // На столе показываем отфильтрованные
    return filteredActiveCards.value
  })

  // 5. Счетчик слов (считаем только активные!)
  const totalWordCount = computed(() => {
    return activeCards.value.reduce((acc, card) => {
      return acc + (card.content.trim() ? card.content.trim().split(/\s+/).length : 0)
    }, 0)
  })

  // Геттер: Есть ли активные фильтры?
  const isFiltered = computed(() => {
    return searchQuery.value.trim() !== '' || selectedColors.value.length > 0
  })

  // --- INTERNAL HELPER (Внутренняя функция сортировки) ---
  const applySort = () => {
    if (sortMode.value === 'newest') {
      // Сортировка строк (ISO date) работает корректно через localeCompare
      // или через new Date(). Но для строк ISO (2025-12-...) достаточно сравнения строк.
      cards.value.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    } else if (sortMode.value === 'oldest') {
      cards.value.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
    } else if (sortMode.value === 'custom') {
      // Сначала по order, если равны — то новые сверху
      cards.value.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order
        return (b.created_at || '').localeCompare(a.created_at || '')
      })
    }
  }

  // --- ACTIONS ---

  // Смена режима (вызывается из UI)
  const setSortMode = (mode: SortMode) => {
    sortMode.value = mode
    applySort() // Сразу применяем сортировку
  }

  // 2. Обновляем updateOrder (вызывается после Drag-n-Drop)
  const updateOrder = async (newActiveCards: Card[]) => {
    // newActiveCards - это только те, что на столе (пришли из VueDraggable)

    // Нам нужно ОБЪЕДИНИТЬ их с архивными карточками, которые мы не трогали
    // Иначе архивные карточки просто исчезнут из state!
    const currentArchived = cards.value.filter(c => c.is_archived)

    // Обновляем индексы у активных
    newActiveCards.forEach((card, index) => {
      card.order = index
    })

    // Собираем полный массив обратно
    cards.value = [...newActiveCards, ...currentArchived]

    // Сохраняем в базу
    await persistOrder()
  }

  // НОВЫЕ ACTIONS
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  const toggleColorFilter = (color: CardColor) => {
    if (selectedColors.value.includes(color)) {
      // Убираем цвет
      selectedColors.value = selectedColors.value.filter(c => c !== color)
    } else {
      // Добавляем цвет
      selectedColors.value.push(color)
    }
  }

  const resetFilters = () => {
    searchQuery.value = ''
    selectedColors.value = []
  }

  // 1. Загрузка (READ)
  const fetchCards = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .select('*')
        // Загружаем всегда в "нативном" порядке, чтобы данные были консистентны
        .order('order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        cards.value = data as Card[]
        applySort() // <--- Применяем текущий выбранный режим после загрузки
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
    const currentMinOrder =
      cards.value.length > 0 ? Math.min(...cards.value.map((c) => c.order)) : 0

    // Формируем объект для БД. ID создаст сама база.
    const payload = {
      content,
      color,
      user_id: authStore.user.id,
      order: currentMinOrder - 1,
    }

    try {
      const { data, error } = await supabase.from('cards').insert(payload).select().single()

      if (error) throw error

      if (data) {
        // Добавляем в начало массива (как unshift)
        cards.value.unshift(data as Card)
      }
    } catch (error) {
      console.error('Ошибка создания:', error)
    }
  }

  // Вместо удаления теперь Архивируем
  const archiveCard = async (id: string) => {
    // Оптимистичное обновление
    const card = cards.value.find(c => c.id === id)
    if (card) card.is_archived = true

    try {
      const { error } = await supabase
        .from('cards')
        .update({ is_archived: true })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Ошибка архивации:', error)
      if (card) card.is_archived = false // Откат
    }
  }

  // Восстановить из архива
  const restoreCard = async (id: string) => {
    const card = cards.value.find(c => c.id === id)
    if (card) card.is_archived = false

    try {
      const { error } = await supabase
        .from('cards')
        .update({ is_archived: false })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Ошибка восстановления:', error)
      if (card) card.is_archived = true // Откат
    }
  }

  // Удалить насовсем (только из архива)
  const deleteForever = async (id: string) => {
    // Удаляем локально
    cards.value = cards.value.filter(c => c.id !== id)

    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Ошибка полного удаления:', error)
      // В идеале тут нужен refetch, но пока оставим так
    }
  }

  // 4. Обновление (UPDATE)
  const updateCardContent = async (id: string, content: string) => {
    const card = cards.value.find((c) => c.id === id)
    if (card) {
      card.content = content
      // Debounce (отложенная отправка) лучше делать в компоненте,
      // но здесь отправим сразу для простоты
      try {
        const { error } = await supabase.from('cards').update({ content }).eq('id', id)

        if (error) throw error
      } catch (error) {
        console.error('Ошибка обновления:', error)
      }
    }
  }

  // 1. Обновляем persistOrder
  const persistOrder = async () => {
    if (!authStore.user) return

    // Берем только АКТИВНЫЕ карточки для обновления порядка
    // Архивные пусть лежат со старым order, это не важно
    const updates = activeCards.value.map((card, index) => ({
      id: card.id,
      user_id: authStore.user!.id,
      content: card.content,
      color: card.color,
      is_archived: false, // Явно указываем, что они активны
      order: index // Перезаписываем порядок от 0 до N
    }))

    try {
      const { error } = await supabase.from('cards').upsert(updates)
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

    // ВАЖНО: Переключаем режим на Custom, чтобы пользователь видел результат перемешивания
    sortMode.value = 'custom'

    // Сохраняем в базу!
    await persistOrder()
  }

  const changeCardColor = async (id: string, newColor: CardColor) => {
    // 1. Оптимистичное обновление UI
    const card = cards.value.find((c) => c.id === id)
    if (card) {
      card.color = newColor
    }

    try {
      // 2. Отправка в БД
      const { error } = await supabase.from('cards').update({ color: newColor }).eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Ошибка смены цвета:', error)
      // Можно откатить цвет обратно, если нужно
    }
  }

  return {
    cards, // Сырой массив (редко нужен напрямую)
    displayedCards, // <-- Используем это в v-for!
    activeCards,
    archivedCards,
    loading,
    totalWordCount,
    sortMode,
    showArchived, // <-- Экспортируем флаг
    searchQuery,
    selectedColors,
    isFiltered, // <--- Экспортируем
    setSearchQuery,
    toggleColorFilter,
    resetFilters,
    setSortMode,
    updateOrder, // экспортировать новый метод
    changeCardColor,
    persistOrder, // Check this!
    fetchCards,
    addCard,
    archiveCard,   // Вместо deleteCard
    restoreCard,   // Для архива
    deleteForever, // Хард-делит
    updateCardContent,
    shuffleCards,
  }
})
