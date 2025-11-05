<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <!-- Header -->
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Nutrition Goals</h2>
              <p class="modal-description">Customize your daily targets</p>
            </div>
            <button @click="closeModal" class="close-button">
              <span class="sr-only">Close</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-divider"></div>

          <!-- Content -->
          <div class="modal-content">
            <!-- Calorie Goal -->
            <div class="goal-card primary-card">
              <div class="card-header">
                <h3 class="card-title">Calorie Target</h3>
                <p class="card-description">Your daily calorie goal</p>
              </div>
              <div class="card-content">
                <label for="calories" class="input-label">Calories (kcal)</label>
                <input
                  id="calories"
                  type="number"
                  v-model.number="localGoals.calories"
                  class="input-field input-large"
                  min="0"
                  step="50"
                />
              </div>
            </div>

            <!-- Macronutrients -->
            <div class="goal-card">
              <div class="card-header">
                <h3 class="card-title">Macronutrient Goals</h3>
                <p class="card-description">Set your protein, carbs, and fat targets</p>
              </div>
              <div class="card-content macros-grid">
                <!-- Protein -->
                <div class="input-group">
                  <label for="protein" class="input-label">Protein (g)</label>
                  <input
                    id="protein"
                    type="number"
                    v-model.number="localGoals.protein"
                    class="input-field"
                    min="0"
                    step="5"
                  />
                </div>

                <!-- Carbs -->
                <div class="input-group">
                  <label for="carbs" class="input-label">Carbohydrates (g)</label>
                  <input
                    id="carbs"
                    type="number"
                    v-model.number="localGoals.carbs"
                    class="input-field"
                    min="0"
                    step="5"
                  />
                </div>

                <!-- Fats -->
                <div class="input-group">
                  <label for="fats" class="input-label">Fats (g)</label>
                  <input
                    id="fats"
                    type="number"
                    v-model.number="localGoals.fats"
                    class="input-field"
                    min="0"
                    step="5"
                  />
                </div>
              </div>
            </div>

            <!-- Quick Presets -->
            <div class="goal-card">
              <div class="card-header">
                <h3 class="card-title">Quick Presets</h3>
                <p class="card-description">Choose a common goal template</p>
              </div>
              <div class="card-content">
                <div class="presets-grid">
                  <button 
                    @click="applyPreset('loss')"
                    class="preset-button"
                  >
                    <span class="preset-name">Weight Loss</span>
                    <span class="preset-cal">1800 cal</span>
                  </button>
                  <button 
                    @click="applyPreset('maintenance')"
                    class="preset-button"
                  >
                    <span class="preset-name">Maintenance</span>
                    <span class="preset-cal">2000 cal</span>
                  </button>
                  <button 
                    @click="applyPreset('gain')"
                    class="preset-button"
                  >
                    <span class="preset-name">Muscle Gain</span>
                    <span class="preset-cal">2800 cal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button @click="closeModal" class="btn btn-outline">
              Cancel
            </button>
            <button @click="saveGoals" class="btn btn-primary">
              Save Goals
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  goals: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'save']);

const localGoals = ref({
  calories: 2000,
  protein: 150,
  carbs: 250,
  fats: 65
});

// Watch for changes in props.goals
watch(() => props.goals, (newGoals) => {
  localGoals.value = { ...newGoals };
}, { immediate: true, deep: true });

const closeModal = () => {
  emit('close');
};

const saveGoals = () => {
  emit('save', { ...localGoals.value });
  closeModal();
};

const applyPreset = (type) => {
  const presets = {
    loss: { calories: 1800, protein: 120, carbs: 200, fats: 60 },
    maintenance: { calories: 2000, protein: 150, carbs: 250, fats: 65 },
    gain: { calories: 2800, protein: 180, carbs: 350, fats: 85 }
  };
  
  localGoals.value = { ...presets[type] };
};
</script>

<style scoped>
/* Modal Overlay - Centered */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* Modal Container - Centered */
.modal-container {
  background: var(--card-bg, #ffffff);
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  gap: 1rem;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary, #1f2937);
  margin: 0;
}

.modal-description {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  margin: 0.25rem 0 0 0;
}

.close-button {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  border-radius: 8px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-button:hover {
  background-color: var(--hover-bg, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.modal-divider {
  height: 1px;
  background-color: var(--border-color, #e5e7eb);
}

/* Content */
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Goal Cards */
.goal-card {
  background: var(--card-bg, #f9fafb);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  padding: 1.25rem;
}

.primary-card {
  border: 2px solid rgba(59, 130, 246, 0.2);
  background: rgba(59, 130, 246, 0.05);
}

.card-header {
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0 0 0.25rem 0;
}

.card-description {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  margin: 0;
}

.card-content {
  margin-top: 0.75rem;
}

/* Input Groups */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #1f2937);
}

.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 8px;
  font-size: 1rem;
  color: var(--text-primary, #1f2937);
  background: var(--input-bg, #ffffff);
  transition: all 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-large {
  height: 3.5rem;
  font-size: 1.5rem;
  font-weight: 700;
}

/* Macros Grid */
.macros-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 640px) {
  .macros-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Presets */
.presets-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .presets-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.preset-button {
  padding: 1rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 8px;
  background: var(--card-bg, #ffffff);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.preset-button:hover {
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.preset-name {
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.preset-cal {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.btn {
  padding: 0.625rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border-color, #d1d5db);
  color: var(--text-primary, #1f2937);
}

.btn-outline:hover {
  background-color: var(--hover-bg, #f3f4f6);
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  padding: 0.625rem 2rem;
}

.btn-primary:hover {
  background-color: #2563eb;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
  opacity: 0;
}

/* Scrollbar */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: transparent;
}

.modal-content::-webkit-scrollbar-thumb {
  background-color: var(--border-color, #d1d5db);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background-color: var(--text-secondary, #6b7280);
}
</style>