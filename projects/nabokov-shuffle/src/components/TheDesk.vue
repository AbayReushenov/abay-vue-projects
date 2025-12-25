<script setup lang="ts">
import { onMounted } from 'vue';
import { useShoeboxStore } from '../stores/shoebox';
import NoteCard from './NoteCard.vue';
import { storeToRefs } from 'pinia';

const store = useShoeboxStore();

// Чтобы вытащить реактивный state/getters, используем storeToRefs.
const { cards, totalWordCount, loading, sortMode } = storeToRefs(store); // Добавил loading
const { addCard, deleteCard, updateCardContent, shuffleCards, fetchCards, setSortMode } = store;

// --- ВАЖНО: Загружаем данные при открытии стола ---
onMounted(() => {
  fetchCards();
})
</script>

<template>
  <div class="desk-container">
    <!-- Панель управления -->
    <header class="toolbar">
      <!-- Блок статистики -->
      <div class="stats">
        <!-- Добавил индикатор загрузки -->
        <span v-if="loading">⏳ Загрузка из облака... | </span>
        Слов: <strong>{{ totalWordCount }}</strong> | Карточек: <strong>{{ cards.length }}</strong>
      </div>

      <!-- Блок Сортировки (НОВОЕ) -->
      <div class="sort-controls">
        <span class="label">Вид:</span>
        <button
          :class="{ active: sortMode === 'newest' }"
          @click="setSortMode('newest')"
        >
          Свежие
        </button>
        <button
          :class="{ active: sortMode === 'oldest' }"
          @click="setSortMode('oldest')"
        >
          Старые
        </button>
        <button
          :class="{ active: sortMode === 'custom' }"
          @click="setSortMode('custom')"
        >
          Мой порядок
        </button>
      </div>

    <!-- Блок Действий -->
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
      <div v-if="cards.length === 0 && !loading" class="empty-state">
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

// Стили для сортировки
.sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  padding: 4px;
  border-radius: 6px;

  .label {
    font-size: 0.85rem;
    color: #888;
    margin-left: 8px;
    margin-right: 4px;
  }

  button {
    background: transparent;
    border: none;
    padding: 6px 12px;
    font-size: 0.9rem;
    cursor: pointer;
    border-radius: 4px;
    color: #666;
    transition: all 0.2s;

    &:hover {
      background: rgba(0,0,0,0.05);
    }

    &.active {
      background: white;
      color: #333;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
  }
}


// Адаптив: если места мало, можно перенести сортировку на новую строку
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .sort-controls {
    justify-content: center;
  }
}
</style>
