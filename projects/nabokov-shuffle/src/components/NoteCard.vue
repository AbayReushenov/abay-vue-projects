<script setup lang="ts">
import type { Card } from '@/types';

// Описываем входящие параметры.
// В React это было бы: const NoteCard = ({ card }: { card: Card }) => ...
defineProps<{
  card: Card
}>();

// Описываем события, которые компонент может "выстрелить" наверх
// В React это коллбэки типа onRemove
const emit = defineEmits<{
  (e: 'remove', id: string): void
  (e: 'update', id: string, content: string): void
}>();
</script>

<template>
  <div class="note-card" :class="`is-${card.color}`">
    <!-- Header с кнопкой удаления -->
    <div class="card-header">
      <span class="card-id">#{{ card.id.slice(0, 4) }}</span>
      <button class="btn-close" @click="emit('remove', card.id)">×</button>
    </div>

    <!-- Тело карточки. Используем contenteditable или textarea для редактирования -->
    <textarea
      class="card-content"
      :value="card.content"
      @input="emit('update', card.id, ($event.target as HTMLTextAreaElement).value)"
      placeholder="Пиши здесь..."
    ></textarea>
  </div>
</template>

<style scoped lang="scss">
.note-card {
  width: 200px;
  height: 280px; // Размер карточки Набокова 3x5 дюймов (примерно)
  padding: 1rem;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  background: #fff;
  transition: all 0.2s ease;

  // Цветовые схемы
  &.is-default { background: #fdfbf7; border: 1px solid #e0e0e0; } // Бумажный цвет
  &.is-yellow  { background: #fff9c4; }
  &.is-blue    { background: #bbdefb; }
  &.is-pink    { background: #f8bbd0; }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px rgba(0,0,0,0.1);
    z-index: 10;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: #999;
  font-size: 0.8rem;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 0.5;
  color: #aaa;
  &:hover { color: #f44336; }
}

.card-content {
  flex: 1;
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  font-family: 'Georgia', serif; // Эстетика пишущей машинки
  font-size: 1rem;
  line-height: 1.5;
  outline: none;

  &::placeholder {
    font-style: italic;
    color: #ccc;
  }
}
</style>
