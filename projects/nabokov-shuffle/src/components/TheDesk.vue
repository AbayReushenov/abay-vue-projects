<script setup lang="ts">
import { useShoeboxStore } from '@/stores/shoebox';
import NoteCard from './NoteCard.vue';
import { storeToRefs } from 'pinia'; // ВАЖНО для деструктуризации

const store = useShoeboxStore();

// Чтобы вытащить реактивный state/getters, используем storeToRefs.
// Actions вытаскиваем напрямую.
const { cards, totalWordCount } = storeToRefs(store);
const { addCard, deleteCard, updateCardContent, shuffleCards } = store;
</script>

<template>
  <div class="desk-container">
    <!-- Панель управления -->
    <header class="toolbar">
      <div class="stats">
        Слов: <strong>{{ totalWordCount }}</strong> | Карточек: <strong>{{ cards.length }}</strong>
      </div>
      <div class="actions">
        <button class="btn-primary" @click="addCard()">+ Новая заметка</button>
        <button class="btn-secondary" @click="shuffleCards()">🎲 Перемешать (Shuffle)</button>
      </div>
    </header>

    <!-- Стол с карточками -->
    <div class="desk-surface">
      <!-- TransitionGroup делает анимацию перемещения автоматической! -->
      <TransitionGroup name="cards-shuffle" tag="div" class="cards-grid">
        <NoteCard
          v-for="card in cards"
          :key="card.id"
          :card="card"
          @remove="deleteCard"
          @update="updateCardContent"
        />
      </TransitionGroup>

      <!-- Заглушка, если пусто -->
      <div v-if="cards.length === 0" class="empty-state">
        <p>Коробка пуста. Начни писать свой шедевр.</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.desk-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eee;
}

.cards-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: flex-start;
}

// Магия анимации Vue
.cards-shuffle-move,
.cards-shuffle-enter-active,
.cards-shuffle-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.cards-shuffle-enter-from,
.cards-shuffle-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

// Абсолютное позиционирование при удалении для плавной анимации соседей
.cards-shuffle-leave-active {
  position: absolute;
}

.btn-primary {
  background: #333;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
  &:hover { background: #000; }
}

.btn-secondary {
  background: white;
  border: 1px solid #ccc;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  &:hover { background: #f5f5f5; }
}

.empty-state {
  text-align: center;
  color: #aaa;
  margin-top: 3rem;
  font-style: italic;
}
</style>
