<template>
  <div class="meals-card">
    <div class="meals-header">
      <h5>{{ title }}</h5>
      <span v-if="meals.length > 0" class="meals-count">{{ includedCount }} of {{ meals.length }} selected</span>
    </div>
    
    <div v-if="loading" class="empty-state">
      <span class="loading-spinner-large"></span>
      <p>Loading meals...</p>
    </div>
    
    <div v-else-if="meals.length === 0" class="empty-state">
      <div class="empty-icon">🍽️</div>
      <p>{{ emptyMessage }}</p>
    </div>
    
    <div v-else class="meals-list">
      <div
        v-for="meal in meals"
        :key="meal.id"
        class="meal-item"
        :class="{ 'meal-unchecked': !meal.included }"
      >
        <div class="meal-content">
          <!-- Checkbox -->
          <div class="meal-checkbox">
            <input
              type="checkbox"
              :id="`meal-${meal.id}`"
              v-model="meal.included"
              @change="onMealToggle"
              class="custom-checkbox"
            />
            <label :for="`meal-${meal.id}`" class="checkbox-label"></label>
          </div>

          <!-- Meal Details -->
          <div class="meal-details">
            <div class="meal-header">
              <strong class="meal-name">{{ meal.name }}</strong>
              <span class="meal-type-badge">{{ formatMealType(meal.meal_type) }}</span>
            </div>
            
            <div class="meal-nutrition">
              <span class="nutrition-item">
                <span class="nutrition-icon">🔥</span>
                {{ Math.round(meal.calories) }} cal
              </span>
              <span class="nutrition-item">
                <span class="nutrition-icon">💪</span>
                {{ meal.protein.toFixed(1) }}g protein
              </span>
              <span class="nutrition-item">
                <span class="nutrition-icon">🌾</span>
                {{ meal.carbs.toFixed(1) }}g carbs
              </span>
              <span class="nutrition-item">
                <span class="nutrition-icon">🥑</span>
                {{ meal.fat.toFixed(1) }}g fat
              </span>
            </div>
            
            <div class="meal-meta">
              <span class="servings-info">Servings: {{ meal.servings }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  meals: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    default: "Today's Meals"
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyMessage: {
    type: String,
    default: 'No meals planned for this day. Go to Meal Planner to add meals!'
  }
})

const emit = defineEmits(['toggle-meal'])

const includedCount = computed(() => {
  return props.meals.filter(meal => meal.included).length
})

function formatMealType(type) {
  const types = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack'
  }
  return types[type] || type
}

function onMealToggle() {
  emit('toggle-meal')
}
</script>

<style scoped>
.meals-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.meals-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.meals-header h5 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.meals-count {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.meals-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.meal-item {
  padding: 1.25rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.meal-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.meal-item.meal-unchecked {
  opacity: 0.5;
  background: #f3f4f6;
}

.meal-content {
  display: flex;
  align-items: start;
  gap: 1rem;
}

.meal-checkbox {
  flex-shrink: 0;
  padding-top: 0.25rem;
}

.custom-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #f97316;
}

.meal-details {
  flex: 1;
}

.meal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.meal-name {
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
}

.meal-type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #fff7ed;
  color: #f97316;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.meal-nutrition {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.nutrition-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #4b5563;
  font-weight: 500;
}

.nutrition-icon {
  font-size: 1rem;
}

.meal-meta {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.servings-info {
  display: inline-block;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.loading-spinner-large {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top-color: #f97316;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 640px) {
  .meal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .meal-nutrition {
    gap: 0.75rem;
  }
  
  .nutrition-item {
    font-size: 0.8125rem;
  }
}
</style>