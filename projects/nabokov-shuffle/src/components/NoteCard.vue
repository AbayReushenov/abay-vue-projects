<script setup lang="ts">
import type { Card } from '@/types';

defineProps<{
  card: Card
}>();

const emit = defineEmits<{
  (e: 'remove', id: string): void
  (e: 'update', id: string, content: string): void
}>();
</script>

<template>
  <div class="note-card" :class="`is-${card.color}`">
    <div class="card-header">
      <span class="card-id">#{{ card.id.slice(0, 4) }}</span>
      <button class="btn-close" @click="emit('remove', card.id)" aria-label="Удалить">×</button>
    </div>

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

  // Цветовые схемы
  &.is-default { background: #fdfbf7; border: 1px solid #efebe9; }
  &.is-yellow  { background: #fffde7; }
  &.is-blue    { background: #e3f2fd; }
  &.is-pink    { background: #fce4ec; }

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
  margin-bottom: 0.75rem;
  color: #90a4ae;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: grab;
}

/* Когда тащим, курсор меняется на "схваченную руку" */
.card-header:active {
  cursor: grabbing;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 0.5;
  color: #b0bec5;
  padding: 0 5px; /* Увеличим область клика для пальцев */
  transition: color 0.2s;
  &:hover { color: #ef5350; }
}

.card-content {
  flex: 1;
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 1.1rem; /* Чуть крупнее текст для чтения */
  line-height: 1.6;
  outline: none;
  color: #2c3e50;

  &::placeholder {
    font-style: italic;
    color: #cfd8dc;
  }
}
</style>
