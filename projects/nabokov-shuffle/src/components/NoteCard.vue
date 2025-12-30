<script setup lang="ts">
import { computed } from 'vue';
import type { Card, CardColor } from '@/types';

const props = defineProps<{
  card: Card,
  isReadOnly?: boolean // <--- Новая пропса (опциональная)
}>();

const emit = defineEmits<{
  (e: 'update', id: string, content: string): void
  (e: 'changeColor', id: string, color: CardColor): void
  // Разделяем события удаления
  (e: 'archive', id: string): void
  (e: 'restore', id: string): void
  (e: 'deleteForever', id: string): void
}>();

// Форматирование даты
const formattedDate = computed(() => {
  if (!props.card.created_at) return '';

  const date = new Date(props.card.created_at);

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short', // "дек"
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
});

// Доступные цвета для палитры
const colors: CardColor[] = ['default', 'yellow', 'blue', 'pink'];

// Маппинг цветов для отображения кружков (CSS background)
const colorMap: Record<CardColor, string> = {
  default: '#fdfbf7', // Белый/Бумажный
  yellow: '#fff9c4',
  blue: '#bbdefb',
  pink: '#f8bbd0'
};
</script>

<template>
  <div class="note-card" :class="[`is-${card.color}`, { 'is-archived': isReadOnly }]">
    <!-- HEADER: Дата + ID + Кнопки -->
    <div class="card-header">
      <div class="header-left">
        <!-- Вернули ID -->
        <span class="card-id">#{{ card.id.slice(0, 4) }}</span>
        <span class="divider">•</span>
        <span class="card-date">{{ formattedDate }}</span>
      </div>

      <div class="header-right">
        <!-- Палитра цветов -->
        <!-- В Архиве палитра не нужна, скрываем -->
        <div v-if="!isReadOnly" class="color-picker">
          <button
            v-for="color in colors"
            :key="color"
            class="color-dot"
            :class="{ active: card.color === color }"
            :style="{ backgroundColor: colorMap[color] }"
            @click.stop="emit('changeColor', card.id, color)"
            :title="`Цвет: ${color}`"
          ></button>
        </div>

        <!-- КНОПКИ ДЕЙСТВИЙ -->
        <template v-if="!isReadOnly">
           <!-- Кнопка "В архив" (бывший крестик) -->
           <button class="btn-action" @click.stop="emit('archive', card.id)" title="В архив">×</button>
        </template>

        <template v-else>
           <!-- Кнопки в Архиве -->
           <button class="btn-restore" @click.stop="emit('restore', card.id)" title="Восстановить">↩</button>
           <button class="btn-danger" @click.stop="emit('deleteForever', card.id)" title="Удалить навсегда">🗑</button>
        </template>
      </div>
    </div>

    <!-- CONTENT: В архиве readonly -->
    <textarea
      class="card-content"
      :value="card.content"
      @input="emit('update', card.id, ($event.target as HTMLTextAreaElement).value)"
      :readonly="isReadOnly"
      :placeholder="isReadOnly ? 'Текст заметки...' : 'Мысль...'"
    ></textarea>
  </div>
</template>

<style scoped lang="scss">
.note-card {
  /* ВАЖНО: Убираем фиксированную ширину. Теперь ширина определяется Grid-контейнером */
  width: 100%;
  /* Минимальная высота для удобства ввода, но может расти */
  min-height: 280px;
  padding: 1.25rem; /* Чуть больше воздуха */
  display: flex;
  flex-direction: column;
  border-radius: 12px; /* Более современные скругления */
  box-shadow: 0 4px 6px rgba(0,0,0,0.05); /* Более мягкая тень */
  background: #fff;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box; /* Чтобы padding не ломал сетку */

  /* Цветовые темы (фон всей карточки) */
  &.is-default { background: #fdfbf7; border: 1px solid #efebe9; }
  &.is-yellow  { background: #fffde7; } // Светло-желтый
  &.is-blue    { background: #e3f2fd; } // Светло-голубой
  &.is-pink    { background: #fce4ec; } // Светло-розовый

  /* На десктопе при наведении легкий подъем */
  @media (hover: hover) {
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 20px rgba(0,0,0,0.08);
      z-index: 10;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center; /* Выравнивание по центру */
  margin-bottom: 0.75rem;
  cursor: grab;
  /* Запрещаем выделение текста в хедере, чтобы не мешало драгу */
  user-select: none;
}

/* Когда тащим, курсор меняется на "схваченную руку" */
.card-header:active {
  cursor: grabbing;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-date {
  font-size: 0.75rem;
  color: #90a4ae;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* --- Color Picker --- */
.color-picker {
  display: flex;
  gap: 4px;
  background: rgba(255,255,255,0.5);
  padding: 2px;
  border-radius: 12px;
  /* transition: opacity 0.2s; */
  /* opacity: 0.5; // Можно сделать полупрозрачным по умолчанию */
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s, border-color 0.2s;

  &:hover {
    transform: scale(1.2);
    border-color: rgba(0,0,0,0.3);
  }

  &.active {
    border: 2px solid #546e7a; /* Выделение активного цвета */
    transform: scale(1.1);
  }
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  color: #b0bec5;
  padding: 0;
  margin-left: 4px;
  &:hover { color: #ef5350; }
}

.card-content {
  flex: 1;
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 1.1rem;
  line-height: 1.6;
  outline: none;
  color: #37474f;

  &::placeholder {
    font-style: italic;
    color: #cfd8dc;
  }
}

/* чтобы ID выглядел красиво */

.header-left {
  display: flex;
  align-items: center;
  gap: 6px; /* Расстояние между элементами */
  font-family: monospace; /* Моноширинный шрифт для "технических" данных */
}

.card-id {
  font-weight: bold;
  color: #78909c; /* Серо-голубой цвет */
  font-size: 0.8rem;
}

.divider {
  color: #cfd8dc; /* Очень светлый разделитель */
  font-size: 0.8rem;
}

.card-date {
  font-size: 0.75rem;
  color: #90a4ae;
}

/* Стиль для архивной карточки */
.is-archived {
  opacity: 0.8;
  background-color: #f5f5f5 !important; /* Серый фон */
  border: 1px dashed #ccc !important;
  box-shadow: none !important;
}

.btn-restore {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  margin-right: 8px;
  color: #4caf50; /* Зеленый */
}

.btn-danger {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  color: #e53935; /* Красный */
}

.btn-action {
    /* Старый стиль btn-close */
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    line-height: 1;
    color: #b0bec5;
    &:hover { color: #ef5350; }
}
</style>
