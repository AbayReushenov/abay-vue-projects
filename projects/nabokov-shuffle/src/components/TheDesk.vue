<script setup lang="ts">
import { onMounted } from 'vue';
import { useShoeboxStore } from '../stores/shoebox';
import NoteCard from './NoteCard.vue';
import { storeToRefs } from 'pinia';

const store = useShoeboxStore();
const { cards, totalWordCount, loading, sortMode } = storeToRefs(store);
const { addCard, deleteCard, updateCardContent, shuffleCards, fetchCards, setSortMode } = store;

onMounted(() => {
  fetchCards();
})
</script>

<template>
  <div class="desk-container">
    <!-- Sticky Toolbar: Прилипает к верху экрана -->
    <header class="toolbar">
      <div class="toolbar-content">
        <!-- Верхний ряд: Статистика и Основные действия -->
        <div class="top-row">
          <div class="stats">
            <span v-if="loading" class="loading-badge">⏳</span>
            <span class="stat-item">📝 {{ cards.length }}</span>
            <span class="stat-item">🔤 {{ totalWordCount }}</span>
          </div>

          <div class="actions">
            <button class="btn-primary" @click="addCard()">+ <span class="desktop-text">Заметка</span></button>
            <button class="btn-secondary" @click="shuffleCards()" title="Перемешать">🎲</button>
          </div>
        </div>

        <!-- Нижний ряд: Сортировка (на мобильных может скроллиться горизонтально) -->
        <div class="sort-controls">
          <button :class="{ active: sortMode === 'newest' }" @click="setSortMode('newest')">Свежие</button>
          <button :class="{ active: sortMode === 'oldest' }" @click="setSortMode('oldest')">Старые</button>
          <button :class="{ active: sortMode === 'custom' }" @click="setSortMode('custom')">Мой порядок</button>
        </div>
      </div>
    </header>

    <div class="desk-surface">
      <TransitionGroup name="cards-shuffle" tag="div" class="cards-grid">
        <NoteCard
          v-for="card in cards"
          :key="card.id"
          :card="card"
          @remove="deleteCard"
          @update="updateCardContent"
        />
      </TransitionGroup>

      <div v-if="cards.length === 0 && !loading" class="empty-state">
        <p>Коробка пуста.</p>
        <button class="btn-text" @click="addCard()">Создать первую карточку</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.desk-container {
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #f4f6f8; /* Легкий фон всей страницы */
}

/* --- TOOLBAR --- */
.toolbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  padding: 0.75rem 1rem;
}

.toolbar-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats {
  font-size: 0.9rem;
  color: #607d8b;
  display: flex;
  gap: 12px;
  align-items: center;
}

.stat-item {
  font-weight: 600;
  color: #37474f;
}

.actions {
  display: flex;
  gap: 8px;
}

/* --- Сортировка --- */
.sort-controls {
  display: flex;
  gap: 4px;
  background: #eceff1;
  padding: 4px;
  border-radius: 8px;
  /* Делаем переключатель компактным inline-блоком */
  align-self: flex-start;

  button {
    flex: 1;
    background: transparent;
    border: none;
    padding: 6px 12px;
    font-size: 0.85rem;
    cursor: pointer;
    border-radius: 6px;
    color: #78909c;
    font-weight: 500;
    white-space: nowrap;
    transition: all 0.2s;

    &:hover { color: #455a64; }

    &.active {
      background: white;
      color: #263238;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
  }
}

/* --- BUTTONS --- */
.btn-primary {
  background: #263238;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
  &:hover { background: #000; }
  &:active { transform: scale(0.98); }
}

.btn-secondary {
  background: white;
  border: 1px solid #cfd8dc;
  color: #455a64;
  padding: 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  &:hover { background: #eceff1; }
}

.btn-text {
  background: none;
  border: none;
  color: #2196f3;
  text-decoration: underline;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 10px;
}

/* --- GRID SYSTEM (САМОЕ ВАЖНОЕ) --- */
.desk-surface {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.cards-grid {
  display: grid;
  /* Магия гридов: */
  /* minmax(280px, 1fr) означает: колонки не меньше 280px, но если места больше — растягивайся */
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  width: 100%;
}

/* --- МОБИЛЬНЫЙ АДАПТИВ (iPhone 13 / 16 Pro) --- */
@media (max-width: 600px) {
  .desk-surface {
    padding: 1rem; /* Уменьшаем отступы по краям экрана */
  }

  .cards-grid {
    /* Принудительно 1 колонка на узких экранах */
    grid-template-columns: 1fr;
    gap: 1rem; /* Уменьшаем расстояние между карточками */
  }

  .desktop-text {
    display: none; /* Скрываем текст "Заметка" на кнопке, оставляем только "+" */
  }

  .sort-controls {
    width: 100%; /* Растягиваем кнопки сортировки на всю ширину */

    button {
      padding: 8px 4px; /* Компактнее */
      font-size: 0.8rem;
    }
  }

  /* На мобильных Toolbar лучше разложить иначе */
  .toolbar-content {
    gap: 1rem;
  }
}

/* --- ANIMATIONS --- */
.cards-shuffle-move,
.cards-shuffle-enter-active,
.cards-shuffle-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.cards-shuffle-enter-from,
.cards-shuffle-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.cards-shuffle-leave-active {
  position: absolute;
  /* Важно для Grid анимации: скрываем уходящий элемент, чтобы сетка перестроилась */
  display: none;
}

.empty-state {
  text-align: center;
  color: #90a4ae;
  margin-top: 4rem;
}
</style>
