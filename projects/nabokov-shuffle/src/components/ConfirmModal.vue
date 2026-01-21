<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

defineProps<{
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  isOpen: boolean
  type?: 'danger' | 'warning' | 'info' // Для цвета кнопки
}>();

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>();

// Закрытие по ESC
const handleKeyup = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('cancel');
};

onMounted(() => window.addEventListener('keyup', handleKeyup));
onUnmounted(() => window.removeEventListener('keyup', handleKeyup));
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="modal-backdrop" @click.self="emit('cancel')">
      <div class="modal-content">
        <h3 v-if="title">{{ title }}</h3>
        <p class="modal-message">{{ message }}</p>

        <div class="modal-actions">
          <button class="btn-cancel" @click="emit('cancel')">
            {{ cancelText || 'Отмена' }}
          </button>

          <button
            class="btn-confirm"
            :class="`is-${type || 'info'}`"
            @click="emit('confirm')"
          >
            {{ confirmText || 'OK' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  animation: slide-up 0.2s ease-out;
}

h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.modal-message {
  color: #546e7a;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

button {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: opacity 0.2s;

  &:hover { opacity: 0.9; }
}

.btn-cancel {
  background: #f5f5f5;
  color: #333;
}

.btn-confirm {
  color: white;

  &.is-info { background: #333; }
  &.is-warning { background: #fbc02d; color: #333; }
  &.is-danger { background: #e53935; }
}

/* Анимации */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
