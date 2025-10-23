<template>
  <AppLayout>
    <AnimatedBackground />

    <div class="nutrition-view">
      <!-- Header -->
      <div class="nutrition-header">
        <div class="container">
          <div class="header-content">
            <div class="nutrition-text">
              <h1>Nutrition Tracker</h1>
              <p>Monitor your daily intake and stay on track with your goals</p>
            </div>
          </div>
        </div>
      </div>

      <div class="container my-4">
        <NutritionTracker />
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '../components/AppLayout.vue'
import AnimatedBackground from '../components/AnimatedBackground.vue'
import NutritionTracker from '../components/NutritionTracker.vue'
</script>

<style scoped>
.nutrition-view {
  min-height: 100vh;
  padding-bottom: 4rem;
}

/* Header */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.nutrition-text h1 {
  color: #6b46c1;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.nutrition-text p {
  color: #666;
  margin: 0;
}

/* Container spacing */
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>
