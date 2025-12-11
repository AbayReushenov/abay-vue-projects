import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { nanoid } from 'nanoid'
import type { Card, CardColor } from '@/types'

export const useShoeboxStore = defineStore('shoebox', () => {
  // --- STATE (Состояние) ---
  // Инициализируем из localStorage, если там что-то есть
  const cards = ref<Card[]>(JSON.parse(localStorage.getItem('nabokov-cards') || '[]'))

  // --- GETTERS (Вычисляемые свойства) ---
  // Пример аналитики: считаем общее количество слов (писатели любят метрики)
  const totalWordCount = computed(() => {
    return cards.value.reduce((acc, card) => {
      // Грубый подсчет слов по пробелам
      return acc + (card.content.trim() ? card.content.trim().split(/\s+/).length : 0)
    }, 0)
  })

  // --- ACTIONS (Действия) ---

  // Добавление новой заметки
  const addCard = (content: string = '', color: CardColor = 'default') => {
    const newCard: Card = {
      id: nanoid(),
      content,
      createdAt: Date.now(),
      color,
      isFocus: false
    }
    // В Vue mutating arrays (push/splice) - это реактивно и нормально!
    // Не нужно делать spread: [...cards, newCard]
    cards.value.unshift(newCard)
  }

  // Удаление
  const deleteCard = (id: string) => {
    cards.value = cards.value.filter(c => c.id !== id)
  }

  // Обновление контента (two-way binding support)
  const updateCardContent = (id: string, content: string) => {
    const card = cards.value.find(c => c.id === id)
    if (card) {
      card.content = content
    }
  }

  // THE SHUFFLE - Метод Набокова
  // Перемешиваем массив случайным образом для поиска вдохновения
  const shuffleCards = () => {
    // Используем алгоритм Фишера-Йейтса для честного шафла
    let currentIndex = cards.value.length;
    let randomIndex: number;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // Swap
      [cards.value[currentIndex], cards.value[randomIndex]] = [
        cards.value[randomIndex]!, cards.value[currentIndex]!];
    }
  }

  // --- PERSISTENCE (Сохранение) ---
  // Вместо middleware, просто следим за изменением cards
  watch(cards, (newCards) => {
    localStorage.setItem('nabokov-cards', JSON.stringify(newCards))
  }, { deep: true })

  // --- EXPORT (Возвращаем наружу то, что нужно компонентам) ---
  return {
    cards,
    totalWordCount,
    addCard,
    deleteCard,
    updateCardContent,
    shuffleCards
  }
})
