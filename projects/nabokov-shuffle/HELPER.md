## Логирование изменений

### Добавление сохранения порядка карточек

### Проблема:
Вы перемешиваете карточки в памяти браузера (cards.value), но база данных об этом новом порядке ничего не знает.
При перезагрузке страницы мы заново запрашиваем данные с сервера, который отдает их в порядке по умолчанию (например, по created_at).


### Для сохранения порядка нужно добавить поле order в таблицу и обновлять его после каждого перемешивания.

### План исправления - Сохранение порядка:

Добавление колонки, которая будет хранить порядковый номер карточки.
Зайти в SQL Editor в панели Supabase и выполните этот скрипт:


```sql
-- Добавляем колонку 'order' (число)
ALTER TABLE cards ADD COLUMN "order" BIGINT DEFAULT 0;
```

2. Обновление Типов (src/types/index.ts)
Новое поле в интерфейс.

```typescript
export interface Card {
  id: string
  content: string
  user_id?: string
  created_at?: string
  color: CardColor
  order: number // <-- Новое поле
}
```

3. Обновление Стора (src/stores/shoebox.ts)
 - При загрузке (fetchCards) сортировать по полю order, а не created_at.
 - После shuffleCards отправлять новый порядок на сервер.

Supabase позволяет делать массовое обновление (Upsert), что идеально подходит для сохранения порядка.

```typescript
// src/stores/shoebox.ts
// ... (импорты те же)

export const useShoeboxStore = defineStore('shoebox', () => {
  // ... (state, getters те же)

  // 1. ИЗМЕНЕНИЕ: Сортировка по 'order' при загрузке
  const fetchCards = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('order', { ascending: true }) // <--- Сортируем по порядку!

      if (error) throw error
      if (data) cards.value = data as Card[]
    } catch (error) {
      console.error('Ошибка загрузки:', error)
    } finally {
      loading.value = false
    }
  }

  // 2. ИЗМЕНЕНИЕ: Обновляем 'order' при создании
  const addCard = async (content: string = '', color: CardColor = 'default') => {
    if (!authStore.user) return

    // Новая карточка должна стать первой (order = 0) или последней.
    // Сделаем её первой. Но тогда всем остальным надо бы сдвинуться.
    // Проще всего: присвоить ей order = min_current_order - 1.
    // Но для простоты пока ставим 0, а Shuffle потом все выровняет.

    // Лучший вариант для MVP: ставим в конец списка
    const currentMaxOrder = cards.value.length > 0
      ? Math.max(...cards.value.map(c => c.order || 0))
      : 0

    const payload = {
      content,
      color,
      user_id: authStore.user.id,
      order: currentMaxOrder + 1 // Ставим в конец
    }

    try {
      const { data, error } = await supabase
        .from('cards')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      if (data) cards.value.push(data as Card) // Добавляем в конец массива
    } catch (error) {
      console.error('Ошибка создания:', error)
    }
  }

  // 3. НОВОЕ: Сохранение порядка на сервере
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

  // 4. ИЗМЕНЕНИЕ: Вызов persistOrder после шафла
  const shuffleCards = async () => {
    const shuffled = [...cards.value]

    // ... ваш алгоритм Фишера-Йейтса (тот самый, исправленный) ...
    let currentIndex = shuffled.length
    let randomIndex: number
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex--
      const temp = shuffled[currentIndex]
      shuffled[currentIndex] = shuffled[randomIndex]!
      shuffled[randomIndex] = temp!
    }

    // Присваиваем новые индексы order прямо в объектах перед сохранением в стейт
    shuffled.forEach((card, index) => {
      card.order = index
    })

    cards.value = shuffled

    // Сохраняем в базу!
    await persistOrder()
  }

  // ... (deleteCard и updateCardContent остаются прежними)

  return {
    // ... exports
    persistOrder, // Экспортируем, если захотим делать Drag-n-Drop позже
    fetchCards,
    addCard,
    shuffleCards,
    // ...
  }
})
```


# Исправим логику добавления новой карточки

Для того чтобы новые карточки появлялись в начале списка, нам нужно изменить логику присвоения номера order при создании.

Самый эффективный способ сделать это без переписывания всей базы данных (чтобы не сдвигать order у всех старых карточек на +1) — это использовать отрицательный индекс или просто число меньше минимального.

Если у вас сейчас карточки имеют порядок 0, 1, 2, то новой карточке мы дадим порядок -1. При сортировке по возрастанию (-1, 0, 1, 2) она встанет первой.

Что нужно изменить в src/stores/shoebox.ts
Вам нужно отредактировать только функцию addCard.

Вместо поиска максимального order, ищем минимальный.

Отнимаем от него 1.

В локальный массив добавляем через unshift (в начало), а не push.

Вот исправленный код действия addCard:

```typescript
  // 2. Добавление (CREATE)
  const addCard = async (content: string = '', color: CardColor = 'default') => {
    if (!authStore.user) return

    // Ищем текущий МИНИМАЛЬНЫЙ order среди всех карточек
    // Если карточек нет, начинаем с 0
    const currentMinOrder = cards.value.length > 0
      ? Math.min(...cards.value.map(c => c.order))
      : 0

    const payload = {
      content,
      color,
      user_id: authStore.user.id,
      // Даем новой карточке порядок меньше, чем у всех остальных
      // Например: было [0, 1, 2], новая получит -1.
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
        // unshift добавляет элемент в НАЧАЛО массива
        cards.value.unshift(data as Card)
      }
    } catch (error) {
      console.error('Ошибка создания:', error)
    }
  }
```
