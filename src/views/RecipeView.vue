<template>
  <AppLayout>
    <div class="recipe-page">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="container text-center">
          <h1 class="hero-title">Discover Your Next Meal</h1>
          <p class="hero-subtitle">Find amazing recipes based on what you have or what you crave</p>
        </div>
      </div>

      <div class="container my-5">
        <!-- Search Card -->
        <div class="search-card">
          <div class="search-header">
            <i class="bi bi-search-heart"></i>
            <h2>Find Recipes</h2>
          </div>
          
          <!-- Pantry Search Button -->
          <button 
            @click="searchByPantry"
            :disabled="loading"
            class="pantry-search-btn"
          >
            <div class="btn-content">
              <i class="bi bi-cart3"></i>
              <div>
                <div class="btn-title">Use My Pantry Ingredients</div>
                <small>Find recipes with what you already have</small>
              </div>
            </div>
            <span v-if="loading" class="spinner-border spinner-border-sm"></span>
            <i v-else class="bi bi-arrow-right"></i>
          </button>
          
          <div class="divider-with-text">
            <span>OR</span>
          </div>
          
          <!-- Search Input -->
          <div class="search-input-wrapper">
            <i class="bi bi-search search-icon"></i>
            <input 
              type="text"
              class="search-input" 
              v-model="searchQuery"
              placeholder="Search for any recipe... (pasta, chicken, tacos)"
              @keyup.enter="searchRecipes"
            >
            <button 
              @click="searchRecipes"
              :disabled="loading || !searchQuery.trim()"
              class="search-btn"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm"></span>
              <span v-else>Search</span>
            </button>
          </div>

          <!-- Filters -->
          <div class="filters-section">
            <h6 class="filters-title">
              <i class="bi bi-funnel me-2"></i>
              Refine Your Search
            </h6>
            <div class="filters-grid">
              <div class="filter-item">
                <label>
                  <i class="bi bi-heart-pulse me-1"></i>
                  Diet
                </label>
                <select v-model="filters.diet" class="filter-select">
                  <option value="">Any Diet</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="gluten free">Gluten Free</option>
                  <option value="ketogenic">Ketogenic</option>
                  <option value="paleo">Paleo</option>
                </select>
              </div>

              <div class="filter-item">
                <label>
                  <i class="bi bi-globe me-1"></i>
                  Cuisine
                </label>
                <select v-model="filters.cuisine" class="filter-select">
                  <option value="">Any Cuisine</option>
                  <option value="italian">Italian</option>
                  <option value="chinese">Chinese</option>
                  <option value="mexican">Mexican</option>
                  <option value="indian">Indian</option>
                  <option value="thai">Thai</option>
                  <option value="american">American</option>
                  <option value="japanese">Japanese</option>
                  <option value="french">French</option>
                </select>
              </div>

              <div class="filter-item">
                <label>
                  <i class="bi bi-clock me-1"></i>
                  Cook Time
                </label>
                <select v-model="filters.maxReadyTime" class="filter-select">
                  <option value="">Any Time</option>
                  <option value="15">Under 15 min</option>
                  <option value="30">Under 30 min</option>
                  <option value="60">Under 1 hour</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Results Count -->
        <div v-if="recipes.length > 0" class="results-header">
          <h3>
            <i class="bi bi-stars me-2"></i>
            Found {{ recipes.length }} Delicious Recipe{{ recipes.length !== 1 ? 's' : '' }}
          </h3>
        </div>

        <!-- Recipe Grid -->
        <div v-if="recipes.length > 0" class="recipes-grid">
          <div v-for="recipe in recipes" :key="recipe.id" class="recipe-card" @click="showRecipeDetails(recipe)">
            <div class="recipe-image-wrapper">
              <img 
                :src="recipe.image" 
                :alt="recipe.title"
                class="recipe-image"
              >
              <div class="recipe-overlay">
                <i class="bi bi-eye-fill"></i>
                <span>View Recipe</span>
              </div>
            </div>
            <div class="recipe-body">
              <h5 class="recipe-title">{{ recipe.title }}</h5>
              <div class="recipe-stats">
                <div class="stat">
                  <i class="bi bi-clock-fill"></i>
                  <span>{{ recipe.readyInMinutes }} min</span>
                </div>
                <div class="stat">
                  <i class="bi bi-heart-fill"></i>
                  <span>{{ recipe.aggregateLikes }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!loading" class="empty-state">
          <div class="empty-icon">
            <i class="bi bi-search"></i>
          </div>
          <h3>Ready to Cook Something Amazing?</h3>
          <p>Search by recipe name or use your pantry ingredients to discover delicious meals!</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p>Searching for delicious recipes...</p>
        </div>
      </div>

      <!-- Recipe Details Modal -->
      <div class="modal fade" id="recipeModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
          <div class="modal-content recipe-modal" v-if="selectedRecipe">
            <div class="modal-header border-0">
              <h5 class="modal-title">{{ selectedRecipe.title }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <img :src="selectedRecipe.image" :alt="selectedRecipe.title" class="modal-recipe-image">
              
              <div class="recipe-info-cards">
                <div class="info-card">
                  <i class="bi bi-clock-fill"></i>
                  <div>
                    <small>Cook Time</small>
                    <strong>{{ selectedRecipe.readyInMinutes }} min</strong>
                  </div>
                </div>
                <div class="info-card">
                  <i class="bi bi-people-fill"></i>
                  <div>
                    <small>Servings</small>
                    <strong>{{ selectedRecipe.servings }}</strong>
                  </div>
                </div>
                <div class="info-card">
                  <i class="bi bi-heart-fill"></i>
                  <div>
                    <small>Likes</small>
                    <strong>{{ selectedRecipe.aggregateLikes }}</strong>
                  </div>
                </div>
              </div>

              <div class="instructions-section">
                <h4>
                  <i class="bi bi-list-ol me-2"></i>
                  Instructions
                </h4>
                <ol v-if="selectedRecipe.analyzedInstructions && selectedRecipe.analyzedInstructions.length > 0" class="instructions-list">
                  <li v-for="(step, index) in selectedRecipe.analyzedInstructions[0].steps" :key="index">
                    <span class="step-number">{{ index + 1 }}</span>
                    <span class="step-text">{{ step.step }}</span>
                  </li>
                </ol>
                <div v-else class="no-instructions">
                  <i class="bi bi-info-circle me-2"></i>
                  <span>Detailed instructions not available for this recipe.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, getCurrentUser } from '@/lib/supabase'
import axios from 'axios'
import { Modal } from 'bootstrap'
import AppLayout from '@/components/AppLayout.vue'

const router = useRouter()
const currentUser = ref(null)
const loading = ref(false)
const recipes = ref([])
const searchQuery = ref('')
const selectedRecipe = ref(null)
let modalInstance = null

const SPOONACULAR_API_KEY = '0ca96dd220c842a6bfdcddfcbcf15b5d'
const SPOONACULAR_URL = 'https://api.spoonacular.com/recipes/complexSearch'

const filters = ref({
  diet: '',
  cuisine: '',
  maxReadyTime: ''
})

const searchByPantry = async () => {
  loading.value = true
  try {
    const { data: pantryItems, error } = await supabase
      .from('pantry_items')
      .select('name')
      .eq('user_id', currentUser.value.id)

    if (error) throw error

    if (!pantryItems || pantryItems.length === 0) {
      alert('Your pantry is empty! Add some ingredients first.')
      loading.value = false
      return
    }

    const ingredients = pantryItems.map(item => item.name).join(',')

    const params = {
      apiKey: SPOONACULAR_API_KEY,
      includeIngredients: ingredients,
      number: 12,
      addRecipeInformation: true,
      addRecipeInstructions: true,
      fillIngredients: true
    }

    if (filters.value.diet) params.diet = filters.value.diet
    if (filters.value.cuisine) params.cuisine = filters.value.cuisine
    if (filters.value.maxReadyTime) params.maxReadyTime = filters.value.maxReadyTime

    const response = await axios.get(SPOONACULAR_URL, { params })
    recipes.value = response.data.results || []

    if (recipes.value.length === 0) {
      alert('No recipes found with your pantry ingredients. Try adjusting filters!')
    }
  } catch (error) {
    console.error('Error:', error)
    alert('Failed to search recipes. Please try again.')
  } finally {
    loading.value = false
  }
}

const searchRecipes = async () => {
  if (!searchQuery.value.trim()) {
    alert('Please enter a recipe name to search')
    return
  }

  loading.value = true
  try {
    const params = {
      apiKey: SPOONACULAR_API_KEY,
      query: searchQuery.value,
      number: 12,
      addRecipeInformation: true,
      addRecipeInstructions: true
    }

    if (filters.value.diet) params.diet = filters.value.diet
    if (filters.value.cuisine) params.cuisine = filters.value.cuisine
    if (filters.value.maxReadyTime) params.maxReadyTime = filters.value.maxReadyTime

    const response = await axios.get(SPOONACULAR_URL, { params })
    recipes.value = response.data.results || []

    if (recipes.value.length === 0) {
      alert('No recipes found. Try a different search term!')
    }
  } catch (error) {
    console.error('Error:', error)
    alert('Failed to search recipes. Please try again.')
  } finally {
    loading.value = false
  }
}

const showRecipeDetails = async (recipe) => {
  selectedRecipe.value = recipe
  await nextTick()
  
  const modalElement = document.getElementById('recipeModal')
  if (modalElement) {
    if (!modalInstance) {
      modalInstance = new Modal(modalElement)
    }
    modalInstance.show()
  }
}

onMounted(async () => {
  try {
    currentUser.value = await getCurrentUser()
  } catch (error) {
    console.error('Error:', error)
    router.push('/login')
  }
})
</script>

<style scoped>
.recipe-page {
  background: linear-gradient(to bottom, #faf8f5 0%, #f5f5f5 100%);
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d5c4 50%, #d4a574 100%);
  padding: 4rem 2rem;
  margin-bottom: 3rem;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.3;
}

.hero-title {
  color: #8b6f47;
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
}

.hero-subtitle {
  color: #6b5d52;
  font-size: 1.25rem;
  margin: 0;
  position: relative;
  z-index: 1;
}

/* Search Card */
.search-card {
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(139, 111, 71, 0.1);
  margin-bottom: 3rem;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-header i {
  font-size: 2rem;
  color: #c89960;
}

.search-header h2 {
  color: #8b6f47;
  font-weight: 700;
  margin: 0;
  font-size: 1.75rem;
}

/* Pantry Search Button */
.pantry-search-btn {
  width: 100%;
  padding: 1.5rem;
  background: linear-gradient(135deg, #d4a574 0%, #c89960 100%);
  border: none;
  border-radius: 15px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(200, 153, 96, 0.3);
}

.pantry-search-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 6px 25px rgba(200, 153, 96, 0.4);
  background: linear-gradient(135deg, #c89960 0%, #b8895a 100%);
}

.pantry-search-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
}

.btn-content i {
  font-size: 2rem;
}

.btn-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.btn-content small {
  opacity: 0.9;
  font-size: 0.85rem;
}

/* Divider */
.divider-with-text {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 2rem 0;
  color: #999;
  font-weight: 600;
}

.divider-with-text::before,
.divider-with-text::after {
  content: '';
  flex: 1;
  border-bottom: 2px solid #e8d7c3;
}

.divider-with-text span {
  padding: 0 1rem;
  background: white;
}

/* Search Input */
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.search-icon {
  position: absolute;
  left: 1.25rem;
  color: #c89960;
  font-size: 1.25rem;
  z-index: 1;
}

.search-input {
  flex: 1;
  padding: 1rem 1rem 1rem 3.5rem;
  border: 2px solid #e8d7c3;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #c89960;
  box-shadow: 0 0 0 4px rgba(200, 153, 96, 0.1);
}

.search-btn {
  padding: 1rem 2rem;
  background: #c89960;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.search-btn:hover:not(:disabled) {
  background: #b8895a;
  transform: translateY(-2px);
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Filters */
.filters-section {
  background: #faf8f5;
  padding: 1.5rem;
  border-radius: 15px;
  border: 2px dashed #e8d7c3;
}

.filters-title {
  color: #8b6f47;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.filter-item label {
  display: block;
  color: #6b5d52;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.filter-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e8d7c3;
  border-radius: 10px;
  background: white;
  color: #333;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-select:focus {
  outline: none;
  border-color: #c89960;
  box-shadow: 0 0 0 3px rgba(200, 153, 96, 0.1);
}

/* Results Header */
.results-header {
  margin-bottom: 2rem;
}

.results-header h3 {
  color: #8b6f47;
  font-weight: 700;
  display: flex;
  align-items: center;
}

.results-header i {
  color: #d4a574;
}

/* Recipe Grid */
.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.recipe-card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.recipe-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 30px rgba(139, 111, 71, 0.2);
}

.recipe-image-wrapper {
  position: relative;
  overflow: hidden;
  height: 220px;
}

.recipe-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.recipe-card:hover .recipe-image {
  transform: scale(1.1);
}

.recipe-overlay {
  position: absolute;
  inset: 0;
  background: rgba(200, 153, 96, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: white;
  gap: 0.5rem;
}

.recipe-card:hover .recipe-overlay {
  opacity: 1;
}

.recipe-overlay i {
  font-size: 2.5rem;
}

.recipe-body {
  padding: 1.5rem;
}

.recipe-title {
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recipe-stats {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.9rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat i {
  color: #c89960;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 5rem 2rem;
}

.empty-icon {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d7c3 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
}

.empty-icon i {
  font-size: 4rem;
  color: #c89960;
}

.empty-state h3 {
  color: #8b6f47;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #999;
  font-size: 1.1rem;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 5rem 2rem;
}

.loading-state .spinner-border {
  width: 3rem;
  height: 3rem;
  color: #c89960;
  margin-bottom: 1rem;
}

.loading-state p {
  color: #8b6f47;
  font-size: 1.1rem;
  font-weight: 500;
}

/* Modal Styles */
.recipe-modal {
  border-radius: 20px;
  border: none;
}

.recipe-modal .modal-header {
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d7c3 100%);
  padding: 1.5rem 2rem;
}

.recipe-modal .modal-title {
  color: #8b6f47;
  font-weight: 700;
  font-size: 1.5rem;
}

.recipe-modal .modal-body {
  padding: 2rem;
}

.modal-recipe-image {
  width: 100%;
  border-radius: 15px;
  margin-bottom: 2rem;
}

.recipe-info-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-card {
  background: #faf8f5;
  padding: 1.25rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 2px solid #e8d7c3;
}

.info-card i {
  font-size: 2rem;
  color: #c89960;
}

.info-card small {
  display: block;
  color: #999;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.info-card strong {
  display: block;
  color: #333;
  font-size: 1.1rem;
}

.instructions-section h4 {
  color: #8b6f47;
  font-weight: 700;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
}

.instructions-list {
  list-style: none;
  padding: 0;
  counter-reset: step-counter;
}

.instructions-list li {
  counter-increment: step-counter;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 1rem;
  line-height: 1.6;
}

.step-number {
  flex-shrink: 0;
  width: 35px;
  height: 35px;
  background: linear-gradient(135deg, #d4a574 0%, #c89960 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.step-number::before {
  content: counter(step-counter);
}

.step-text {
  flex: 1;
  color: #333;
  padding-top: 0.5rem;
}

.no-instructions {
  background: #faf8f5;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  color: #999;
  border: 2px dashed #e8d7c3;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .search-card {
    padding: 1.5rem;
  }
  
  .recipes-grid {
    grid-template-columns: 1fr;
  }
  
  .recipe-info-cards {
    grid-template-columns: 1fr;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .search-input-wrapper {
    flex-direction: column;
  }
  
  .search-btn {
    width: 100%;
  }
}
</style>