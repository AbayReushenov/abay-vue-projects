<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import TheDesk from './components/TheDesk.vue';
import AuthForm from './components/AuthForm.vue';

const authStore = useAuthStore()

// При загрузке приложения проверяем, есть ли активная сессия
onMounted(() => {
  authStore.initialize()
})
</script>

<template>
  <!-- Если пользователь есть — показываем стол -->
  <TheDesk v-if="authStore.user" />

  <!-- Если нет — показываем форму входа -->
  <AuthForm v-else />
</template>

<style>
/* Глобальные стили для body, чтобы убрать отступы */
body {
  margin: 0;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background-color: #f4f4f9;
}
</style>
