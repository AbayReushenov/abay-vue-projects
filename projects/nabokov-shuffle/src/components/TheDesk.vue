<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { VueDraggable } from 'vue-draggable-plus';
import { useShoeboxStore } from '../stores/shoebox';
import NoteCard from './NoteCard.vue';

const store = useShoeboxStore();
const { displayedCards, totalWordCount, loading, sortMode, showArchived } = storeToRefs(store);
const { addCard, updateCardContent, shuffleCards, fetchCards, setSortMode, updateOrder,
  changeCardColor, archiveCard, restoreCard, deleteForever } = store;

onMounted(() => {
  fetchCards();
});

// Обработчик окончания перетаскивания
const onDragEnd = () => {
  // Важно: передаем только то, что сейчас на экране (displayedCards)
  updateOrder(displayedCards.value);
}
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
            <!-- Меняем заголовок в зависимости от режима -->
            <span class="mode-title">{{ showArchived ? '🗑️ Архив' : '✍️ Мастерская' }}</span>
            <span class="stat-separator">|</span>
            <span class="stat-item">📝 {{ displayedCards.length }}</span>
            <span v-if="!showArchived" class="stat-item">🔤 {{ totalWordCount }}</span>
          </div>

          <div class="actions">
            <!-- Кнопка переключения Архива -->
            <button
              class="btn-archive-toggle"
              @click="store.showArchived = !store.showArchived"
              :class="{ active: showArchived }"
            >
              {{ showArchived ? '← Назад к столу' : 'Архив' }}
            </button>

            <!-- Кнопки действий (скрываем в архиве) -->
            <template v-if="!showArchived">
              <button class="btn-primary" @click="addCard()">+ <span class="desktop-text">Заметка</span></button>
              <button class="btn-secondary" @click="shuffleCards()" title="Перемешать">🎲</button>
            </template>
          </div>
        </div>

        <!-- Нижний ряд: Сортировка (на мобильных может скроллиться горизонтально) -->
        <!-- Сортировка (скрываем в архиве, там она не особо нужна, или оставляем) -->
        <div v-if="!showArchived" class="sort-controls">
          <button :class="{ active: sortMode === 'newest' }" @click="setSortMode('newest')">Свежие</button>
          <button :class="{ active: sortMode === 'oldest' }" @click="setSortMode('oldest')">Старые</button>
          <button :class="{ active: sortMode === 'custom' }" @click="setSortMode('custom')">Мой порядок</button>
        </div>
      </div>
    </header>

    <div class="desk-surface">
      <!--
        ЗАМЕНА TransitionGroup НА VueDraggable
        v-model="cards" - двусторонняя связь с массивом
        :animation="150" - время анимации сдвига (мс)
        handle=".drag-handle" - (Опционально) если хотите тянуть только за иконку.
                                Пока оставим тянуть за всю карточку, кроме текста.
        class="cards-grid" - тот же класс сетки
        @end="onDragEnd" - вызываем сохранение, когда бросили
      -->
      <!--
        Используем displayedCards в v-model
        Отключаем перетаскивание (disabled), если мы в архиве!
      -->
      <VueDraggable
        v-model="displayedCards"
        :animation="200"
        class="cards-grid"
        ghost-class="ghost"
        handle=".card-header"
        @end="onDragEnd">
        <!--
           ВАЖНО: Внутри VueDraggable нужен один корневой элемент для цикла,
           либо компонент должен принимать аттрибуты.
           NoteCard принимает класс и style нормально.
        -->
        <NoteCard
          v-for="card in displayedCards"
          :key="card.id"
          :card="card"
          :is-read-only="showArchived"
          @archive="archiveCard"
          @restore="restoreCard"
          @deleteForever="deleteForever"
          @update="updateCardContent"
          @changeColor="changeCardColor"
        />
      </VueDraggable>

      <!-- Empty States -->
      <div v-if="displayedCards.length === 0 && !loading" class="empty-state">
        <p v-if="!showArchived">Коробка пуста. Начни писать свой шедевр.</p>
        <p v-else>Архив пуст. Все заметки в работе.</p>

        <button v-if="!showArchived" class="btn-text" @click="addCard()">Создать первую карточку</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.desk-container {
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #f4f6f8;
  /* Легкий фон всей страницы */
}

/* --- TOOLBAR --- */
.toolbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
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

    &:hover {
      color: #455a64;
    }

    &.active {
      background: white;
      color: #263238;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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

  &:hover {
    background: #000;
  }

  &:active {
    transform: scale(0.98);
  }
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

  &:hover {
    background: #eceff1;
  }
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
  /* Было: minmax(320px, 1fr) или 280px */
  /* Стало: minmax(360px, 1fr) */
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.5rem;
  width: 100%;
}

/* --- МОБИЛЬНЫЙ АДАПТИВ (iPhone 13 / 16 Pro) --- */
@media (max-width: 600px) {
  .desk-surface {
    padding: 1rem;
    /* Уменьшаем отступы по краям экрана */
  }

  .cards-grid {
    /* Принудительно 1 колонка на узких экранах */
    grid-template-columns: 1fr;
    gap: 1rem;
    /* Уменьшаем расстояние между карточками */
  }

  .desktop-text {
    display: none;
    /* Скрываем текст "Заметка" на кнопке, оставляем только "+" */
  }

  .sort-controls {
    width: 100%;
    /* Растягиваем кнопки сортировки на всю ширину */

    button {
      padding: 8px 4px;
      /* Компактнее */
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

/* Стили для Drag-n-Drop */

/* Класс "призрака" - место, куда упадет карточка */
.ghost {
  opacity: 0.4;
  background: #e0e0e0;
  border: 2px dashed #999;
}

/* При перетаскивании курсор меняется */
.cards-grid {
  /* Важно для работы библиотеки внутри Grid */
  display: grid;
  // grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.5rem;
  width: 100%;
}

@media (max-width: 600px) {
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* Добавим стили для режима Архива */
.archive-mode {
  background-color: #e0e0e0; /* Серый фон, чтобы сразу понять контекст */
  min-height: 100vh;
}

.archive-mode .toolbar {
  background: #d6d6d6;
  border-bottom: 1px solid #bbb;
}

.btn-archive-toggle {
  background: white;
  border: 1px solid #ccc;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #333;

  &:hover { background: #f5f5f5; }
  &.active { background: #333; color: white; border-color: #333; }
}

.mode-title {
  font-weight: bold;
  font-size: 1.1rem;
  color: #2c3e50;
}
</style>
