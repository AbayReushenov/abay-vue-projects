<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'; // Добавили ref и watch
import { storeToRefs } from 'pinia';
import { VueDraggable } from 'vue-draggable-plus';
import { useShoeboxStore } from '@/stores/shoebox';
import NoteCard from './NoteCard.vue';
import type { Card, ConfirmState } from '../types'; // Важно для типизации
import ConfirmModal from './ConfirmModal.vue';
import NoteCardSkeleton from './NoteCardSkeleton.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore()

const store = useShoeboxStore();
const { displayedCards, totalWordCount, loading, sortMode, showArchived,
  searchQuery, selectedColors, isFiltered } = storeToRefs(store);
const { addCard, updateCardContent, shuffleCards, fetchCards, setSortMode, updateOrder,
  changeCardColor, archiveCard, restoreCard, deleteForever,
  toggleColorFilter,
  resetFilters } = store;

// 2. Единое состояние для всех подтверждений
const confirmState = ref<ConfirmState>({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'OK',
  type: 'info',
  onConfirm: () => {},
});

// --- ИСПРАВЛЕНИЕ: Локальный мутабельный массив для Drag-n-Drop ---
const draggableList = ref<Card[]>([]);

// 1. Синхронизация: Store (ReadOnly) -> Local (Mutable)
// Когда данные приходят с сервера или меняется фильтр (архив/стол), обновляем локальный список
watch(displayedCards, (newVal) => {
  // Создаем поверхностную копию массива, чтобы разорвать связь с ReadOnly Computed
  draggableList.value = [...newVal];
}, { immediate: true, deep: true });

onMounted(async () => {
  // Если юзер уже есть - грузим сразу
  if (authStore.user) {
    await fetchCards();
  }
});

// А если юзера нет (страница только грузится), ждем появления
watch(
  () => authStore.user,
  async (newUser) => {
    if (newUser) {
      await fetchCards();
    }
  }
);

// 2. Синхронизация: Local -> Store
// Вызывается после завершения перетаскивания
const onDragEnd = () => {
  // Отправляем новый порядок в стор для сохранения
  updateOrder(draggableList.value);
}

// 3. Универсальная функция открытия
const openConfirm = (
  title: string,
  message: string,
  onConfirmAction: () => void,
  type: 'info' | 'warning' | 'danger' = 'info',
  confirmText: string = 'OK'
) => {
  confirmState.value = {
    isOpen: true,
    title,
    message,
    type,
    confirmText,
    onConfirm: async () => {
      // Закрываем модалку и выполняем действие
      confirmState.value.isOpen = false;
      await onConfirmAction();
    }
  };
};


// А. Для Шаффла
const handleShuffleClick = () => {
  openConfirm(
    'Перемешать карточки?',
    'Порядок заметок будет изменен случайным образом.',
    () => shuffleCards(),
    'info',
    'Перемешать'
  );
};

// Б. Для Удаления навсегда (вызывается из NoteCard @deleteForever)
const handleDeleteForever = (id: string) => {
  openConfirm(
    'Удалить навсегда?',
    'Эту заметку нельзя будет восстановить. Вы уверены?',
    () => deleteForever(id),
    'danger', // Красная кнопка!
    'Удалить'
  );
};
</script>

<template>
  <div class="desk-container" :class="{ 'archive-mode': showArchived }">
    <header class="toolbar">
      <div class="toolbar-content">
        <!-- ВЕРХНИЙ РЯД (Статистика + Кнопки) -->
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
              <button class="btn-secondary" @click="handleShuffleClick()" title="Перемешать">🎲</button>
            </template>
          </div>
        </div>

        <!-- СРЕДНИЙ РЯД: Поиск и Фильтры (Только в Мастерской) -->
        <div v-if="!showArchived" class="filters-row">
          <!-- Поиск -->
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Найти мысль..."
              class="search-input"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="btn-clear">×</button>
          </div>

          <!-- Фильтры по цветам -->
          <div class="color-filters">
            <button
              v-for="color in ['default', 'yellow', 'blue', 'pink']"
              :key="color"
              class="filter-dot"
              :class="[`is-${color}`, { active: selectedColors.includes(color as any) }]"
              @click="toggleColorFilter(color as any)"
              :title="`Фильтр: ${color}`"
            ></button>

            <!-- Кнопка сброса (показываем, если есть активные фильтры) -->
            <button
              v-if="selectedColors.length > 0 || searchQuery"
              class="btn-reset"
              @click="resetFilters"
            >
              Сброс
            </button>
          </div>
        </div>

         <!-- НИЖНИЙ РЯД: Сортировка (без изменений) -->
        <div v-if="!showArchived" class="sort-controls">
          <button :class="{ active: sortMode === 'newest' }" @click="setSortMode('newest')">Свежие</button>
          <button :class="{ active: sortMode === 'oldest' }" @click="setSortMode('oldest')">Старые</button>
          <button :class="{ active: sortMode === 'custom' }" @click="setSortMode('custom')">Мой порядок</button>
        </div>
      </div>
    </header>

    <div class="desk-surface">
        <!-- ВАРИАНТ 1: ПОКАЗЫВАЕМ СКЕЛЕТОНЫ ПРИ ЗАГРУЗКЕ -->
        <div v-if="loading" class="cards-grid">
          <NoteCardSkeleton v-for="n in 6" :key="n" />
        </div>

        <!-- ВАРИАНТ 2: ПОКАЗЫВАЕМ РЕАЛЬНЫЕ КАРТОЧКИ (только когда загрузка кончилась) -->
        <!-- Можно использовать v-else или v-show="!loading" -->
        <!-- Но лучше v-else, чтобы не было прыжков -->
      <VueDraggable
        v-else
        v-model="draggableList"
        :animation="200"
        class="cards-grid"
        ghost-class="ghost"
        handle=".card-header"
        :disabled="showArchived || isFiltered"
        @end="onDragEnd">

        <!-- ВАЖНО: Итерируемся по draggableList, а не по displayedCards -->
        <NoteCard
          v-for="card in draggableList"
          :key="card.id"
          :card="card"
          :is-read-only="showArchived"
          @archive="archiveCard"
          @restore="restoreCard"
          @deleteForever="handleDeleteForever"
          @update="updateCardContent"
          @changeColor="changeCardColor"
        />
      </VueDraggable>

      <!-- Empty States -->
      <div v-if="displayedCards.length === 0 && !loading" class="empty-state">
        <!-- Кейс 1: Фильтр ничего не нашел -->
        <div v-if="store.isFiltered">
           <p>Ничего не найдено по вашему запросу.</p>
           <button class="btn-text" @click="store.resetFilters">Сбросить фильтры</button>
        </div>

        <!-- Кейс 2: Архив пуст -->
        <div v-else-if="showArchived">
           <p>Архив пуст. Все заметки в работе.</p>
        </div>

        <!-- Кейс 3: Вообще пусто (начало работы) -->
        <div v-else>
           <p>Коробка пуста. Начни писать свой шедевр.</p>
           <button class="btn-text" @click="addCard()">Создать первую карточку</button>
        </div>
      </div>
    </div>

    <ConfirmModal
      :is-open="confirmState.isOpen"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-text="confirmState.confirmText"
      :type="confirmState.type"
      @cancel="confirmState.isOpen = false"
      @confirm="confirmState.onConfirm"
    />
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

.desk-surface {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.cards-grid {
  display: grid;
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

/* --- СТИЛИ ДЛЯ ПОИСКА И ФИЛЬТРОВ --- */
.filters-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap; /* Чтобы на мобильном переносилось */
}

.search-box {
  position: relative;
  flex: 1; /* Занимает доступное место */
  display: flex;
  align-items: center;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 8px 30px 8px 32px; /* Место под иконку и крестик */
  border: 1px solid #cfd8dc;
  border-radius: 20px; /* Овальная форма */
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #607d8b;
  }
}

.search-icon {
  position: absolute;
  left: 10px;
  opacity: 0.5;
  font-size: 0.9rem;
}

.btn-clear {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  color: #999;
  &:hover { color: #333; }
}

.color-filters {
  display: flex;
  gap: 6px;
  align-items: center;
}

.filter-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent; /* Рамка для активного состояния */
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;

  /* Цвета точек (совпадают с карточками) */
  &.is-default { background: #fdfbf7; border-color: #e0e0e0; }
  &.is-yellow  { background: #fff9c4; }
  &.is-blue    { background: #bbdefb; }
  &.is-pink    { background: #f8bbd0; }

  &:hover { transform: scale(1.1); }

  /* Активное состояние: жирная рамка или тень */
  &.active {
    transform: scale(1.2);
    border-color: #546e7a; /* Темная рамка */
    box-shadow: 0 0 0 2px rgba(84, 110, 122, 0.2);
  }
}

.btn-reset {
  font-size: 0.8rem;
  color: #e53935;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  margin-left: 4px;
}

/* Мобильная адаптация */
@media (max-width: 600px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .color-filters {
    justify-content: center;
  }
}
</style>
