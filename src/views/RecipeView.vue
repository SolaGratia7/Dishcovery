<template>
  <AppLayout>
    <AnimatedBackground />
    
    <div class="recipe-page">
      <!-- Header -->
      <div class="recipe-header">
        <div class="container">
          <div class="header-content">
            <div class="recipe-text">
              <h1>Discover Recipes</h1>
              <p>Find amazing recipes based on what you have or what you crave</p>
            </div>
          </div>
        </div>
      </div>

      <div class="container my-4">
        <!-- Search Card -->
        <div class="search-card">
          <div class="search-buttons">
            <button 
              @click="searchByPantry"
              :disabled="loading"
              class="pantry-search-btn"
            >
              <i class="bi bi-cart3 me-2"></i>
              <span>Find Recipes with My Ingredients</span>
              <span v-if="loading" class="spinner-border spinner-border-sm ms-2"></span>
            </button>
            
            <div class="divider-text">OR</div>
            
            <div class="search-input-group">
              <i class="bi bi-search"></i>
              <input 
                type="text"
                v-model="searchQuery"
                placeholder="Search for any recipe... (pasta, chicken, tacos)"
                @keyup.enter="searchRecipes"
                class="search-input"
              >
              <button 
                @click="searchRecipes"
                :disabled="loading || !searchQuery.trim()"
                class="search-btn"
              >
                Search
              </button>
            </div>
          </div>

          <!-- Filters -->
          <div class="filters-row">
            <div class="filter-item">
              <label><i class="bi bi-heart-pulse me-1"></i> Diet</label>
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
              <label><i class="bi bi-globe me-1"></i> Cuisine</label>
              <select v-model="filters.cuisine" class="filter-select">
                <option value="">Any Cuisine</option>
                <option value="italian">Italian</option>
                <option value="chinese">Chinese</option>
                <option value="mexican">Mexican</option>
                <option value="indian">Indian</option>
                <option value="thai">Thai</option>
                <option value="american">American</option>
              </select>
            </div>

            <div class="filter-item">
              <label><i class="bi bi-clock me-1"></i> Cook Time</label>
              <select v-model="filters.maxReadyTime" class="filter-select">
                <option value="">Any Time</option>
                <option value="15">Under 15 min</option>
                <option value="30">Under 30 min</option>
                <option value="60">Under 1 hour</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Results Count -->
        <div v-if="recipes.length > 0" class="results-info">
          Found {{ recipes.length }} delicious recipe{{ recipes.length !== 1 ? 's' : '' }}
        </div>

        <!-- Recipe Grid -->
        <div v-if="recipes.length > 0" class="recipes-grid">
          <div v-for="recipe in recipes" :key="recipe.id" class="recipe-card">
            <!-- Recipe Image -->
            <div class="recipe-image-container">
              <img 
                :src="recipe.image" 
                :alt="recipe.title"
                class="recipe-image"
                @click="showRecipeDetails(recipe)"
              >
                <button class="favorite-btn" @click.stop="toggleFavorite(recipe.id)">
                  <i :class="isFavorited(recipe.id) ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
                </button>
            </div>

            <!-- Recipe Info -->
            <div class="recipe-info">
              <h5 class="recipe-title">{{ recipe.title }}</h5>
              <p class="recipe-description" v-if="recipe.summary">
                {{ stripHtml(recipe.summary).substring(0, 80) }}...
              </p>

              <!-- Tags -->
              <div class="recipe-tags">
                <span v-if="recipe.vegetarian" class="tag vegetarian">Vegetarian</span>
                <span v-if="recipe.vegan" class="tag vegan">Vegan</span>
                <span v-if="recipe.glutenFree" class="tag gluten-free">Gluten-Free</span>
              </div>

              <!-- Stats -->
              <div class="recipe-stats">
                <div class="stat">
                  <i class="bi bi-clock"></i>
                  <span>{{ recipe.readyInMinutes }} min</span>
                </div>
                <div class="stat">
                  <i class="bi bi-people"></i>
                  <span>{{ recipe.servings }} servings</span>
                </div>
                <div class="stat">
                  <i class="bi bi-heart-fill text-danger"></i>
                  <span>{{ recipe.aggregateLikes }}</span>
                </div>
              </div>

              <!-- View Button -->
              <button 
                @click="showRecipeDetails(recipe)"
                class="btn-view-recipe"
              >
                <i class="bi bi-book me-2"></i>
                View Recipe
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!loading" class="empty-state">
          <i class="bi bi-search"></i>
          <h3>Ready to Cook Something Amazing?</h3>
          <p>Search by recipe name or use your pantry ingredients to discover delicious meals!</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="spinner-border text-primary"></div>
          <p>Searching for delicious recipes...</p>
        </div>
      </div>

      <RecipeModal 
        :recipe="selectedRecipe" 
        @close="selectedRecipe = null" 
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, getCurrentUser } from '@/lib/supabase'
import axios from 'axios'
import AppLayout from '@/components/AppLayout.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import RecipeModal from '@/components/RecipeModal.vue'


const router = useRouter()
const currentUser = ref(null)
const loading = ref(false)
const recipes = ref([])
const searchQuery = ref('')
const selectedRecipe = ref(null)
const savedRecipeIds = ref(new Set())

const SPOONACULAR_URL = 'https://api.spoonacular.com/recipes/complexSearch'

const filters = ref({
  diet: '',
  cuisine: '',
  maxReadyTime: ''
})

const SPOONACULAR_API_KEY = [
  '0ca96dd220c842a6bfdcddfcbcf15b5d',
  'c96375c9282445708f1b26ce2d7e04a9',
  '19de6749a5064deea9ebf17f2455d6bb'
]

let currentKeyIndex = 0

const makeApiRequest = async (params, retries = SPOONACULAR_API_KEY.length) => {
  try {
    const response = await axios.get(SPOONACULAR_URL, {
      params: {
        ...params,
        apiKey: SPOONACULAR_API_KEY[currentKeyIndex]
      }
    })
    return response
  } catch (error) {
    // If rate limited and we have more keys to try
    if (error.response?.status === 402 && retries > 1) {
      console.log('Rate limit hit, trying next API key...')
      currentKeyIndex = (currentKeyIndex + 1) % SPOONACULAR_API_KEY.length
      return makeApiRequest(params, retries - 1)
    }
    throw error
  }
}

// Then update your search functions:
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
      includeIngredients: ingredients,
      number: 12,
      addRecipeInformation: true,
      addRecipeInstructions: true,
      fillIngredients: true
    }

    if (filters.value.diet) params.diet = filters.value.diet
    if (filters.value.cuisine) params.cuisine = filters.value.cuisine
    if (filters.value.maxReadyTime) params.maxReadyTime = filters.value.maxReadyTime

    const response = await makeApiRequest(params)
    recipes.value = response.data.results || []

    if (recipes.value.length === 0) {
      alert('No recipes found with your pantry ingredients.')
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
      query: searchQuery.value,
      number: 12,
      addRecipeInformation: true,
      addRecipeInstructions: true,
      fillIngredients: true
    }

    if (filters.value.diet) params.diet = filters.value.diet
    if (filters.value.cuisine) params.cuisine = filters.value.cuisine
    if (filters.value.maxReadyTime) params.maxReadyTime = filters.value.maxReadyTime

    const response = await makeApiRequest(params)
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

const showRecipeDetails = (recipe) => {
  selectedRecipe.value = recipe
}

const loadSavedRecipes = async () => {
  try {
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('id')
      .eq('user_id', currentUser.value.id)

    if (error) throw error

    savedRecipeIds.value = new Set(data.map(r => r.id))
  } catch (error) {
    console.error('Error loading saved recipes:', error)
  }
}

const isFavorited = (id) => {
  return savedRecipeIds.value.has(id)
}

const toggleFavorite = async (id) => {
  try {
    const recipe = recipes.value.find(r => r.id === id)
    if (!recipe) return

    const { data: existing, error: fetchError } = await supabase
      .from('saved_recipes')
      .select('id')
      .eq('user_id', currentUser.value.id)
      .eq('id', id)
      .maybeSingle()

    if (fetchError) throw fetchError

    if (existing) {
      // Remove from favorites
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', currentUser.value.id)
        .eq('id', id)

      if (error) throw error
      
      savedRecipeIds.value.delete(id) // Update UI
      
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('saved_recipes')
        .insert({
          user_id: currentUser.value.id,
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          readyInMinutes: recipe.readyInMinutes || 0,
          servings: recipe.servings || 0,
          aggregateLikes: recipe.aggregateLikes || 0,
          summary: recipe.summary || '',
          analyzedInstructions: recipe.analyzedInstructions 
            ? JSON.stringify(recipe.analyzedInstructions)
            : '',
          extendedIngredients: recipe.extendedIngredients || [],
          dishTypes: recipe.dishTypes || [],
          vegetarian: recipe.vegetarian || false,
          vegan: recipe.vegan || false,
          glutenFree: recipe.glutenFree || false
        })

      if (error) throw error
      
      savedRecipeIds.value.add(id) // Update UI
    }

  } catch (error) {
    console.error('Error toggling favorite:', error)
    alert('Failed to update favorites. Please try again.')
  }
}

const stripHtml = (html) => {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

onMounted(async () => {
  try {
    currentUser.value = await getCurrentUser()
    await loadSavedRecipes()
  } catch (error) {
    console.error('Error:', error)
    router.push('/login')
  }
})
</script>

<style scoped>
.recipe-page {
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

.recipe-text h1 {
  color: #6b46c1;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.recipe-text p {
  color: #666;
  margin: 0;
}

/* Search Card */
.search-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid #ffd4b3;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-buttons {
  margin-bottom: 1rem;
}

.pantry-search-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.pantry-search-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
}

.pantry-search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider-text {
  text-align: center;
  color: #999;
  font-weight: 600;
  margin: 1rem 0;
}

.search-input-group {
  display: flex;
  gap: 0.5rem;
  position: relative;
  align-items: center;
}

.search-input-group i {
  position: absolute;
  left: 1rem;
  color: #999;
  font-size: 1.1rem;
}

.search-input {
  flex: 1;
  padding: 0.65rem 1rem 0.75rem 3rem;
  border: 2px solid #ffd4b3;
  border-radius: 10px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #ff6b1a;
}

.search-btn {
  padding: 0.75rem 1.5rem;
  background: #ff6b1a;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.search-btn:hover:not(:disabled) {
  background: #e55f17;
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Filters */
.filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0e8dc;
}

.filter-item label {
  display: block;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.filter-select {
  width: 100%;
  padding: 0.625rem;
  border: 2px solid #ffd4b3;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.5);
}

.filter-select:focus {
  outline: none;
  border-color: #ff6b1a;
}

/* Results Info */
.results-info {
  color: #666;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

/* Recipe Grid */
.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.recipe-card {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.recipe-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.recipe-image-container {
  position: relative;
  width: 100%;
  height: 240px;
  overflow: hidden;
}

.recipe-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s;
}

.recipe-card:hover .recipe-image {
  transform: scale(1.05);
}

.favorite-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  background: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}

.favorite-btn:hover {
  transform: scale(1.1);
  background: #fee2e2;
}

.favorite-btn i {
  font-size: 1.1rem;
  color: #ef4444;
}

.recipe-info {
  padding: 1.25rem;
}

.recipe-title {
  color: #1a1a1a;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recipe-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.recipe-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  padding: 0.25rem 0.625rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tag.vegetarian {
  background: #dcfce7;
  color: #166534;
}

.tag.vegan {
  background: #d1fae5;
  color: #065f46;
}

.tag.gluten-free {
  background: #fef3c7;
  color: #92400e;
}

.recipe-stats {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #666;
  font-size: 0.85rem;
}

.stat i {
  color: #ff6b1a;
  font-size: 1rem;
}

.btn-view-recipe {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #ff6b1a 0%, #ff9800 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-view-recipe:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 26, 0.3);
}

/* Empty/Loading States */
.empty-state {
  text-align: center;
  padding: 5rem 2rem;
  background: white;
  border-radius: 16px;
}

.empty-state i {
  font-size: 5rem;
  color: #ddd;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
}

.loading-state {
  text-align: center;
  padding: 5rem 2rem;
}

.loading-state .spinner-border {
  width: 3rem;
  height: 3rem;
  color: #ff6b1a;
  margin-bottom: 1rem;
}

.loading-state p {
  color: #666;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .recipes-grid {
    grid-template-columns: 1fr;
  }
  
  .search-input-group {
    flex-direction: column;
  }
  
  .search-btn {
    width: 100%;
  }
}
</style>