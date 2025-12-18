<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const isLinkSent = ref(false) // Флаг: ссылка отправлена?
const errorMessage = ref('')

const authStore = useAuthStore()

const handleLogin = async () => {
  if (!email.value) return

  errorMessage.value = ''
  // Вызываем action из стора
  const result = await authStore.signIn(email.value)

  if (result.success) {
    isLinkSent.value = true
  } else {
    errorMessage.value = result.error || 'Ошибка при отправке'
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Nabokov Shuffle</h2>
      <p class="subtitle">Вход в мастерскую</p>

      <!-- Состояние 1: Ссылка отправлена -->
      <div v-if="isLinkSent" class="success-message">
        <h3>🚀 Проверьте почту!</h3>
        <p>Мы отправили волшебную ссылку на <strong>{{ email }}</strong>.</p>
        <p>Нажмите на неё, чтобы войти.</p>
        <button @click="isLinkSent = false" class="btn-secondary">Назад</button>
      </div>

      <!-- Состояние 2: Форма входа -->
      <form v-else @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="writer@example.com"
            required
            :disabled="authStore.loading"
          />
        </div>

        <button type="submit" :disabled="authStore.loading">
          {{ authStore.loading ? 'Отправка...' : 'Получить ссылку' }}
        </button>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Минималистичный стиль "карточки" по центру */
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f4f4f9;
}

.auth-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.input-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

input {
  width: 100%;
  padding: 0.75rem;
  margin-top: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

button:hover {
  background-color: #000;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error {
  color: #e63946;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.btn-secondary {
  background-color: transparent;
  color: #666;
  border: 1px solid #ddd;
  margin-top: 1rem;
}
</style>
