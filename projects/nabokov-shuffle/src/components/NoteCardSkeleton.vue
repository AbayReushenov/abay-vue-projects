<template>
  <div class="skeleton-card">
    <!-- Имитация хедера -->
    <div class="skeleton-header">
      <div class="skeleton-line short"></div>
      <div class="skeleton-circle"></div>
    </div>

    <!-- Имитация текста (несколько линий) -->
    <div class="skeleton-body">
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line medium"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  width: 100%;
  min-height: 280px; /* Должно совпадать с min-height реальной карточки */
  padding: 1.25rem;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #f0f0f0;
  box-sizing: border-box;
}

/* Анимация пульсации */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.skeleton-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-line {
  height: 12px;
  background: #eee;
  border-radius: 6px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #eee;
  animation: pulse 1.5s infinite ease-in-out;
  animation-delay: 0.2s; /* Легкий рассинхрон */
}

.short { width: 30%; }
.medium { width: 60%; }
</style>
