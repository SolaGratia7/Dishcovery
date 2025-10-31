<template>
    <Teleport to="body">
        <!-- Recipe Details Modal -->
        <div v-if="recipe" class="modal-overlay" @click="closeModal">
            <div class="modal-content" @click.stop>
            <button @click="closeModal" class="btn-close-modal">
                <i class="bi bi-x-lg"></i>
            </button>

            <img :src="recipe.image" :alt="recipe.title" class="modal-image">

            <div class="modal-body">
                <h2>{{ recipe.title }}</h2>

                <div class="modal-stats">
                <div class="modal-stat">
                    <i class="bi bi-clock-fill"></i>
                    <div>
                    <small>Cook Time</small>
                    <strong>{{ recipe.readyInMinutes }} min</strong>
                    </div>
                </div>
                <div class="modal-stat">
                    <i class="bi bi-people-fill"></i>
                    <div>
                    <small>Servings</small>
                    <strong>{{ recipe.servings }}</strong>
                    </div>
                </div>
                <div class="modal-stat">
                    <i class="bi bi-heart-fill"></i>
                    <div>
                    <small>Likes</small>
                    <strong>{{ recipe.aggregateLikes }}</strong>
                    </div>
                </div>
                </div>
                <div class="ingredients-section">
                  <h4><i class="bi bi-basket-fill me-2"></i>Ingredients</h4>
                  <ul v-if="ingredients && ingredients.length > 0" class="ingredients-list">
                      <li v-for="(ingredient, index) in ingredients" :key="index">
                      <span class="ingredient-amount">{{ ingredient.amount }} {{ ingredient.unit }}</span>
                      <span class="ingredient-name">{{ ingredient.name }}</span>
                      </li>
                  </ul>
                  <p v-else class="no-ingredients">
                      <i class="bi bi-info-circle me-2"></i>
                      Ingredients list not available for this recipe.
                  </p>
                </div>                

                <div class="instructions-section">
                <h4><i class="bi bi-list-ol me-2"></i>Instructions</h4>
                <ol v-if="instructions && instructions.length > 0 && instructions[0].steps" class="instructions-list">
                    <li v-for="(step, index) in instructions[0].steps" :key="index">
                    {{ step.step }}
                    </li>
                </ol>
                <p v-else class="no-instructions">
                    <i class="bi bi-info-circle me-2"></i>
                    Detailed instructions not available for this recipe.
                </p>
                </div>
            </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  recipe: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

// Handle both formats: API (array) and Supabase (JSON string)
const instructions = computed(() => {
  if (!props.recipe) return []

  let data = props.recipe.analyzedInstructions

  // Parse repeatedly until it's not a string anymore
  while (typeof data === 'string' && data.trim()) {
    try {
      data = JSON.parse(data)
    } catch (e) {
      // If parsing fails, stop and return empty
      console.error('Error parsing instructions:', e)
      console.log('Raw data:', data)
      return []
    }
  }

  return Array.isArray(data) ? data : []
})

// Handle ingredients from Supabase (JSON string or array)
const ingredients = computed(() => {
  if (!props.recipe) return []

  let data = props.recipe.extendedIngredients

  // Parse repeatedly until it's not a string anymore
  while (typeof data === 'string' && data.trim()) {
    try {
      data = JSON.parse(data)
    } catch (e) {
      // If parsing fails, stop and return empty
      console.error('Error parsing ingredients:', e)
      console.log('Raw data:', data)
      return []
    }
  }

  return Array.isArray(data) ? data : []
})

// Lock body scroll when modal is open
watch(() => props.recipe, (newRecipe) => {
  if (newRecipe) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}, { immediate: true })

// Cleanup on unmount
onUnmounted(() => {
  document.body.style.overflow = ''
})

const closeModal = () => {
  document.body.style.overflow = ''
  emit('close')
}
</script>

<style scoped>
/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding-top: 5rem;
  padding-left: 1rem;
  padding-right: 1rem;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 700px;
  width: 100%;
  max-height: calc(100vh - 6rem);
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.btn-close-modal {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  background: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.btn-close-modal:hover {
  transform: scale(1.1);
}

.modal-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 16px 16px 0 0;
}

.modal-body {
  padding: 2rem;
}

.modal-body h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
}

.modal-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.modal-stat {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-stat i {
  font-size: 1.75rem;
  color: #ff6b1a;
}

.modal-stat small {
  display: block;
  color: #999;
  font-size: 0.75rem;
}

.modal-stat strong {
  display: block;
  color: #1a1a1a;
  font-size: 1.1rem;
}

/* Ingredients Section */
.ingredients-section {
  margin-bottom: 2rem;
}

.ingredients-section h4 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 1rem;
}

.ingredients-list {
  list-style: none;
  padding: 0;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1.5rem;
}

.ingredients-list li {
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ingredients-list li:last-child {
  border-bottom: none;
}

.ingredient-amount {
  font-weight: 600;
  color: #ff6b1a;
  min-width: 100px;
  font-size: 0.95rem;
}

.ingredient-name {
  color: #333;
  text-transform: capitalize;
  flex: 1;
}

.no-ingredients {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 10px;
  text-align: center;
  color: #999;
}

/* Instructions Section */
.instructions-section h4 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 1rem;
}

.instructions-list {
  padding-left: 1.5rem;
  line-height: 1.8;
}

.instructions-list li {
  margin-bottom: 1rem;
  color: #333;
}

.no-instructions {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 10px;
  text-align: center;
  color: #999;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding-top: 5rem;
  }

  .modal-content {
    max-height: calc(100vh - 6rem);
    max-height: calc(100dvh - 6rem); /* Use dynamic viewport height for mobile */
  }

  .modal-stats {
    grid-template-columns: 1fr;
  }

  .modal-image {
    height: 200px;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-body h2 {
    font-size: 1.5rem;
  }
}
</style>
