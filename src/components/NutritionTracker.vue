<template>
  <div class="nutrition-tracker">
    <div class="tracker-layout">
      <!-- Main Content -->
      <div class="main-content">
        <!-- Nutrition Goals Section -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="nutrition-card fade-in">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">Daily Nutrition Goals</h5>
                <button 
                  class="btn btn-primary btn-sm"
                  @click="showGoalsModal = true"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit Goals
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Nutrition Progress Circles -->
        <div class="row mb-4">
          <div class="col-6 col-md-3 mb-3 mb-md-0">
            <div class="nutrition-card fade-in">
              <div class="progress-circle pc-calories">
                <span id="cal-display">{{ calPct }}%</span>
              </div>
              <div class="nutrition-stat">
                <div class="stat-value">{{ Math.round(totals.calories) }}</div>
                <div class="stat-label">/ {{ goals.calories }} cal</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3 mb-3 mb-md-0">
            <div class="nutrition-card fade-in">
              <div class="progress-circle pc-protein">
                <span>{{ protPct }}%</span>
              </div>
              <div class="nutrition-stat">
                <div class="stat-value">{{ totals.protein.toFixed(1) }}g</div>
                <div class="stat-label">/ {{ goals.protein }}g protein</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3 mb-3 mb-md-0">
            <div class="nutrition-card fade-in">
              <div class="progress-circle pc-carbs">
                <span>{{ carbPct }}%</span>
              </div>
              <div class="nutrition-stat">
                <div class="stat-value">{{ totals.carbs.toFixed(1) }}g</div>
                <div class="stat-label">/ {{ goals.carbs }}g carbs</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3 mb-3 mb-md-0">
            <div class="nutrition-card fade-in">
              <div class="progress-circle pc-fat">
                <span>{{ fatPct }}%</span>
              </div>
              <div class="nutrition-stat">
                <div class="stat-value">{{ totals.fat.toFixed(1) }}g</div>
                <div class="stat-label">/ {{ goals.fat }}g fat</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="row mb-4">
          <div class="col-lg-6">
            <div class="nutrition-card fade-in">
              <h5 class="mb-3">Macro Breakdown</h5>
              <div class="chart-container">
                <canvas ref="macroChartCanvas"></canvas>
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="nutrition-card fade-in">
              <h5 class="mb-3">Daily Progress</h5>
              <div class="chart-container">
                <canvas ref="progressChartCanvas"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Mode Toggle (visible on medium screens) -->
        <div class="mode-toggle-card mb-4">
          <div class="toggle-container">
            <div :class="['toggle-slider', { 'right': viewMode === 'log' }]"></div>
            <button
              :class="['toggle-btn', { 'active': viewMode === 'meals' }]"
              @click="viewMode = 'meals'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              View Meals
            </button>
            <button
              :class="['toggle-btn', { 'active': viewMode === 'log' }]"
              @click="viewMode = 'log'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Search Meal
            </button>
          </div>
        </div>

        <!-- Meals View Content (Calendar + Meals List) -->
        <div class="meals-view-wrapper">
          <!-- Calendar moved here for medium screens -->
          <div class="calendar-sidebar-responsive">
            <div class="calendar-section">
              <div class="calendar-dropdown scrollable-card">
                <div class="calendar-header">
                  <h6>View Nutrition History</h6>
                  <small class="text-muted">Choose from a highlighted date to view that day's nutrition data</small>
                </div>
                <div class="selected-date-display">
                  <small class="text-muted">Selected: {{ formatDisplayDate(selectedDate) }}</small>
                </div>
                <div class="calendar-container">
                  <MiniCalendar
                    :currentWeek="selectedDate"
                    :selectedDates="[selectedDateStr]"
                    :datesWithMeals="datesWithMeals"
                    mode="single"
                    :highlight-selected="true"
                    :autoClose="false"
                    @select-date="onDateSelect"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Today's Meals -->
          <div class="nutrition-card meals-section scrollable-card">
            <h5 class="mb-3">{{ selectedDateStr === todayStr ? "Today's" : selectedDateStr + "'s" }} Meals</h5>
            <div v-if="isLoadingMeals" class="empty-state">
              <span class="loading-spinner-large"></span>
              <p>Loading meals...</p>
            </div>
            <div v-else-if="currentMeals.length === 0" class="empty-state">
              <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">🍽️</div>
              <p>No meals logged yet. Log a meal above!</p>
            </div>
            <div v-else class="meals-list-container">
              <div
                v-for="meal in currentMeals"
                :key="meal.id"
                class="meal-item"
              >
                <div class="d-flex justify-content-between align-items-center">
                  <div class="meal-details">
                    <strong>{{ meal.name }}</strong>
                    <div class="small text-muted">
                      {{ Math.round(meal.calories) }} cal | {{ meal.protein.toFixed(1) }}g protein | {{ meal.carbs.toFixed(1) }}g carbs | {{ meal.fat.toFixed(1) }}g fat
                    </div>
                    <div class="small text-muted">Servings: {{ meal.servings }}</div>
                  </div>
                  <button
                    class="btn btn-outline-danger btn-sm delete-btn"
                    @click="handleDeleteMeal(meal)"
                    title="Delete meal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Log Meal Form -->
        <div class="nutrition-card log-meal-section">
          <h5 class="mb-3">Log Meal</h5>
          <div class="alert-custom alert-warning">
            <small>⚠️ Only meals/foods recognized by Spoonacular can be logged. Start typing to see suggestions.</small>
          </div>
          <form @submit.prevent="logMeal">
            <div class="row g-3">
              <div class="col-12 col-md-5 autocomplete-container">
                <input
                  type="text"
                  v-model="mealName"
                  class="form-control"
                  placeholder="Start typing food/meal..."
                  required
                  autocomplete="off"
                  @input="onMealInput"
                  @focus="showLogButton = true"
                  @blur="handleMealInputBlur"
                >
                <div v-if="mealSuggestions.length > 0" class="autocomplete-results">
                  <div
                    v-for="suggestion in mealSuggestions"
                    :key="suggestion.id"
                    class="autocomplete-item"
                    @click="selectMeal(suggestion)"
                  >
                    {{ suggestion.name || suggestion.title }}
                  </div>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <input
                  type="number"
                  v-model.number="mealServings"
                  class="form-control"
                  placeholder="Servings"
                  min="0.1"
                  step="0.1"
                  required
                  @focus="showLogButton = true"
                  @blur="handleServingsBlur"
                >
              </div>
              <div class="col-6 col-md-4">
                <button 
                  type="submit" 
                  class="btn btn-primary w-100 log-meal-btn" 
                  :class="{ 'show': showLogButton }"
                  :disabled="isLogging"
                  @mouseenter="showLogButton = true"
                >
                  <span v-if="!isLogging">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Log Meal
                  </span>
                  <span v-else>
                    <span class="loading-spinner"></span>   
                    Logging...
                  </span>
                </button>
              </div>
            </div>
          </form>

          <!-- Logged Meals in Log Mode -->
          <div class="logged-meals-in-form mt-4">
            <h6 class="mb-3">{{ selectedDateStr === todayStr ? "Today's" : selectedDateStr + "'s" }} Logged Meals</h6>
            <div v-if="isLoadingMeals" class="empty-state-compact">
              <span class="loading-spinner-small"></span>
              <p>Loading...</p>
            </div>
            <div v-else-if="currentMeals.length === 0" class="empty-state-compact">
              <p>No meals logged yet</p>
            </div>
            <div v-else class="meals-scroll-container">
              <div
                v-for="meal in currentMeals"
                :key="meal.id"
                class="meal-item-compact"
              >
                <div class="meal-content">
                  <strong class="meal-name">{{ meal.name }}</strong>
                  <div class="small text-muted meal-info">
                    {{ Math.round(meal.calories) }} cal | {{ meal.protein.toFixed(1) }}g P | {{ meal.carbs.toFixed(1) }}g C | {{ meal.fat.toFixed(1) }}g F
                  </div>
                </div>
                <button
                  class="btn-delete-compact"
                  @click="handleDeleteMeal(meal)"
                  title="Delete meal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Goals Modal -->
    <div v-if="showGoalsModal" class="modal-overlay" @click="showGoalsModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h5>Edit Nutrition Goals</h5>
          <button class="btn-close" @click="showGoalsModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Calories</label>
            <input type="number" v-model.number="tempGoals.calories" class="form-control" min="1000" max="5000" step="50">
          </div>
          <div class="form-group">
            <label>Protein (g)</label>
            <input type="number" v-model.number="tempGoals.protein" class="form-control" min="50" max="500" step="5">
          </div>
          <div class="form-group">
            <label>Carbs (g)</label>
            <input type="number" v-model.number="tempGoals.carbs" class="form-control" min="50" max="500" step="5">
          </div>
          <div class="form-group">
            <label>Fat (g)</label>
            <input type="number" v-model.number="tempGoals.fat" class="form-control" min="20" max="200" step="5">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showGoalsModal = false">Cancel</button>
          <button class="btn btn-primary" @click="saveGoals">Save Goals</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import MiniCalendar from './MiniCalendar.vue'
import { supabase, getCurrentUser } from '@/lib/supabase'
import Swal from 'sweetalert2'

// Constants
const USE_LOCAL_DATABASE = true

//API_KEY
const SPOONACULAR_URL = 'https://api.spoonacular.com/recipes/complexSearch'
const SPOONACULAR_API_KEY = [
  import.meta.env.VITE_SPOONACULAR_KEY_1,
  import.meta.env.VITE_SPOONACULAR_KEY_2,
  import.meta.env.VITE_SPOONACULAR_KEY_3,
  import.meta.env.VITE_SPOONACULAR_KEY_4,  
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

//Search Recipes
const loading = ref(false)
const recipes = ref([])
const searchQuery = ref('')
const searchRecipes = async () => {
  if (!searchQuery.value.trim()) {
    Swal.fire({
      icon: 'warning',
      title: 'Empty Search',
      text: 'Please enter a recipe name to search.'
    })
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

    const response = await makeApiRequest(params)
    recipes.value = response.data.results || []

    if (recipes.value.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'No recipes found. Try a different search term!'
      })
    } else {
      // Scroll to cook time filter on smaller screens
      await nextTick()
      if (window.innerWidth <= 768) {
        const cookTimeFilter = document.querySelector('.filter-item:nth-child(3)')
        if (cookTimeFilter) {
          cookTimeFilter.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }
  } catch (error) {
    console.error('Error:', error)
    Swal.fire({
      icon: 'info',
      title: 'No Recipes Found',
      text: 'Try a different search term!'
    })
  } finally {
    loading.value = false
  }
}

const showRecipeDetails = (recipe) => {
  selectedRecipe.value = recipe
}

// Extended local foods database
const localFoodsDB = [
  { id: 5001, name: "Grilled Chicken Salad", calories: 350, protein: 35, carbs: 15, fat: 18 },
  { id: 5002, name: "Spaghetti Bolognese", calories: 550, protein: 28, carbs: 65, fat: 18 },
  { id: 5003, name: "Beef Burger", calories: 520, protein: 30, carbs: 40, fat: 25 },
  { id: 5004, name: "Caesar Salad", calories: 380, protein: 15, carbs: 12, fat: 32 },
  { id: 5005, name: "Chicken Stir Fry", calories: 420, protein: 32, carbs: 45, fat: 12 },
  { id: 5006, name: "Salmon with Rice", calories: 480, protein: 35, carbs: 50, fat: 15 },
  { id: 5007, name: "Pizza Margherita", calories: 450, protein: 18, carbs: 55, fat: 18 },
  { id: 5008, name: "Vegetable Curry", calories: 320, protein: 12, carbs: 48, fat: 10 },
  { id: 5009, name: "Beef Tacos", calories: 380, protein: 25, carbs: 35, fat: 16 },
  { id: 5010, name: "Tuna Sandwich", calories: 340, protein: 22, carbs: 42, fat: 8 },
  { id: 5011, name: "Chicken Burrito", calories: 520, protein: 30, carbs: 58, fat: 18 },
  { id: 5012, name: "Greek Salad", calories: 280, protein: 12, carbs: 15, fat: 20 },
  { id: 5013, name: "Pork Fried Rice", calories: 480, protein: 24, carbs: 62, fat: 16 },
  { id: 5014, name: "Chicken Quesadilla", calories: 440, protein: 28, carbs: 38, fat: 20 },
  { id: 5015, name: "Beef Stew", calories: 380, protein: 32, carbs: 28, fat: 15 },
  { id: 5016, name: "Fish and Chips", calories: 620, protein: 28, carbs: 68, fat: 28 },
  { id: 5017, name: "Chicken Wrap", calories: 420, protein: 26, carbs: 45, fat: 14 },
  { id: 5018, name: "Vegetable Lasagna", calories: 380, protein: 18, carbs: 42, fat: 16 },
  { id: 5019, name: "Shrimp Pasta", calories: 460, protein: 28, carbs: 52, fat: 14 },
  { id: 5020, name: "BBQ Chicken", calories: 390, protein: 35, carbs: 25, fat: 16 },
  { id: 5021, name: "Omelette", calories: 280, protein: 20, carbs: 4, fat: 20 },
  { id: 5022, name: "Pancakes", calories: 520, protein: 12, carbs: 78, fat: 18 },
  { id: 5023, name: "French Toast", calories: 480, protein: 14, carbs: 68, fat: 16 },
  { id: 5024, name: "Avocado Toast", calories: 320, protein: 12, carbs: 38, fat: 14 },
  { id: 5025, name: "Smoothie Bowl", calories: 380, protein: 8, carbs: 72, fat: 8 }
]

// Reactive data
const currentUser = ref(null)
const selectedDate = ref(new Date())
const selectedDateStr = computed(() => formatDate(selectedDate.value))
const todayStr = computed(() => formatDate(new Date()))

const loggedMeals = ref([])
const isLoadingMeals = ref(false)
const goals = ref({
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65
})

const mealName = ref('')
const mealServings = ref(1)
const isLogging = ref(false)
const selectedFood = ref(null)
const mealSuggestions = ref([])
let autocompleteTimeout = null
const showLogButton = ref(false)
const showGoalsModal = ref(false)
const tempGoals = ref({ ...goals.value })
const viewMode = ref('meals') // 'meals' or 'log'

// Charts refs
const macroChartCanvas = ref(null)
const progressChartCanvas = ref(null)
let macroChart = null
let progressChart = null

// Computed properties
const currentMeals = computed(() => {
  return loggedMeals.value.filter(meal => meal.date === selectedDateStr.value)
})

const datesWithMeals = computed(() => {
  const dates = new Set()
  loggedMeals.value.forEach(meal => {
    dates.add(meal.date)
  })
  return Array.from(dates)
})

const totals = computed(() => {
  return currentMeals.value.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
})

const calPct = computed(() => Math.round((totals.value.calories / goals.value.calories) * 100))
const protPct = computed(() => Math.round((totals.value.protein / goals.value.protein) * 100))
const carbPct = computed(() => Math.round((totals.value.carbs / goals.value.carbs) * 100))
const fatPct = computed(() => Math.round((totals.value.fat / goals.value.fat) * 100))

// Methods
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseNutritionValue(value) {
  if (!value) return 0
  return parseFloat(value.toString().replace(/[^0-9.]/g, '')) || 0
}

async function getNutritionByName(mealName) {
  if (USE_LOCAL_DATABASE) {
    const found = localFoodsDB.find(f =>
      f.name.toLowerCase() === mealName.toLowerCase() ||
      f.name.toLowerCase().includes(mealName.toLowerCase()) ||
      mealName.toLowerCase().includes(f.name.toLowerCase())
    )

    if (found) {
      return {
        calories: Number(found.calories) || 0,
        protein: Number(found.protein) || 0,
        carbs: Number(found.carbs) || 0,
        fat: Number(found.fat) || 0
      }
    }

    return { calories: 400, protein: 20, carbs: 45, fat: 15 }
  }

  try {
    const searchResponse = await fetch(
      `${SPOONACULAR_URL}/food/menuItems/search?apiKey=${SPOONACULAR_API_KEY}&query=${encodeURIComponent(mealName)}&number=1`
    )
    if (!searchResponse.ok) throw new Error('Search failed')
    const searchData = await searchResponse.json()

    if (!searchData.menuItems || searchData.menuItems.length === 0) {
      throw new Error('Food not found')
    }

    const foodId = searchData.menuItems[0].id
    const nutritionResponse = await fetch(
      `${SPOONACULAR_URL}/food/menuItems/${foodId}?apiKey=${SPOONACULAR_API_KEY}`
    )
    if (!nutritionResponse.ok) throw new Error('Nutrition fetch failed')
    const nutritionData = await nutritionResponse.json()

    return {
      calories: parseNutritionValue(nutritionData.nutrition?.calories),
      protein: parseNutritionValue(nutritionData.nutrition?.protein),
      carbs: parseNutritionValue(nutritionData.nutrition?.carbs),
      fat: parseNutritionValue(nutritionData.nutrition?.fat)
    }
  } catch (error) {
    console.error('Error getting nutrition by name:', error)
    return { calories: 500, protein: 30, carbs: 50, fat: 20 }
  }
}

async function loadMealsFromSupabase() {
  isLoadingMeals.value = true
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .order('date', { ascending: false })

    if (error) throw error
    
    const transformedMeals = []
    
    for (const plan of data || []) {
      const nutrition = await getNutritionByName(plan.title)
      const servings = plan.servings || 1

      transformedMeals.push({
        id: `${plan.date}-${plan.meal_type}-${plan.id}`,
        name: plan.title,
        servings: servings,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        date: plan.date,
        timestamp: new Date(plan.date).toISOString()
      })
    }
    
    loggedMeals.value = transformedMeals
    
  } catch (error) {
    console.error('Error loading meals from Supabase:', error)
    const saved = localStorage.getItem('nutritionMeals')
    if (saved) {
      try {
        loggedMeals.value = JSON.parse(saved)
      } catch {
        console.warn('Failed to parse saved meals')
      }
    }
  } finally {
    isLoadingMeals.value = false
  }
}

async function saveMealToSupabase(meal) {
  try {
    const { error } = await supabase
      .from('nutrition_meals')
      .insert({
        user_id: currentUser.value.id,
        spoonacular_id: meal.spoonacularId,
        name: meal.name,
        servings: meal.servings,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        date: meal.date,
        timestamp: meal.timestamp
      })

    if (error) throw error
    return true
    
  } catch (error) {
    console.error('Error saving meal to Supabase:', error)
    localStorage.setItem('nutritionMeals', JSON.stringify(loggedMeals.value))
    return false
  }
}

async function deleteMealFromSupabase(mealId) {
  try {
    const mealToDelete = loggedMeals.value.find(m => m.id === mealId)
    
    if (!mealToDelete) return false

    const { error } = await supabase
      .from('nutrition_meals')
      .delete()
      .eq('id', mealToDelete.id)
      .eq('user_id', currentUser.value.id)

    if (error) throw error
    return true
    
  } catch (error) {
    console.error('Error deleting meal from Supabase:', error)
    return false
  }
}

async function searchFood(query) {
  if (query.length < 2) return []

  // if (USE_LOCAL_DATABASE) {
  //   const lowerQuery = query.toLowerCase()
  //   return localFoodsDB.filter(item => item.name.toLowerCase().includes(lowerQuery)).slice(0, 10)
  // }

  try {
    // Use complexSearch for recipes instead of menuItems
    const response = await fetch(
      `${SPOONACULAR_URL}/recipes/complexSearch?query=${encodeURIComponent(query)}&number=10&apiKey=${SPOONACULAR_API_KEY}`
    )

    if (!response.ok) throw new Error('API request failed')
    const data = await response.json()
    
    const pattern = new RegExp(`\\b${query}`, 'i')
return (data.results || [])
  .filter(recipe => pattern.test(recipe.title))
  .map(recipe => ({
    id: recipe.id,
    title: recipe.title,
    name: recipe.title,
    image: recipe.image
  }))
  } catch (error) {
    console.error('Food search error:', error)
    // Fallback to local database on error
    const lowerQuery = query.toLowerCase()
    return localFoodsDB.filter(item => item.name.toLowerCase().includes(lowerQuery)).slice(0, 10)
  }
}

async function getFoodNutrition(id) {
  // if (USE_LOCAL_DATABASE) {
  //   const found = localFoodsDB.find(f => f.id == id)
  //   if (!found) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  //   return {
  //     calories: Number(found.calories) || 0,
  //     protein: Number(found.protein) || 0,
  //     carbs: Number(found.carbs) || 0,
  //     fat: Number(found.fat) || 0
  //   }
  // }

  try {
    // Use recipe nutrition endpoint
    const response = await fetch(
      `${SPOONACULAR_URL}/recipes/${id}/nutritionWidget.json?apiKey=${SPOONACULAR_API_KEY}`
    )
    
    if (!response.ok) throw new Error('API request failed')
    const data = await response.json()

    // Helper function to extract nutrient amount
    const getNutrientAmount = (nutrientName) => {
      const nutrient = data.nutrients?.find(n => 
        n.name.toLowerCase() === nutrientName.toLowerCase()
      )
      return parseFloat(nutrient?.amount || 0)
    }

    return {
      calories: getNutrientAmount('Calories'),
      protein: getNutrientAmount('Protein'),
      carbs: getNutrientAmount('Carbohydrates'),
      fat: getNutrientAmount('Fat')
    }
  } catch (error) {
    console.error('Food nutrition error:', error)
    // Fallback to local database on error
    const found = localFoodsDB.find(f => f.id == id)
    if (!found) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    return {
      calories: Number(found.calories) || 0,
      protein: Number(found.protein) || 0,
      carbs: Number(found.carbs) || 0,
      fat: Number(found.fat) || 0
    }
  }
}

function onMealInput() {
  clearTimeout(autocompleteTimeout)
  const query = mealName.value.trim()

  if (query.length < 2) {
    mealSuggestions.value = []
    return
  }

  autocompleteTimeout = setTimeout(async () => {
    mealSuggestions.value = await searchFood(query)
  }, 300)
}

function selectMeal(suggestion) {
  selectedFood.value = suggestion
  mealName.value = suggestion.name || suggestion.title
  mealSuggestions.value = []
}

async function logMeal() {
  if (!selectedFood.value) {
    await Swal.fire('Invalid Selection', 'Please select a valid food/meal from the suggestions', 'info')
    return
  }

  if (mealServings.value <= 0) {
    await Swal.fire('Invalid Servings', 'Please enter a valid number of servings', 'info')
    return
  }

  isLogging.value = true

  try {
    const nutrition = await getFoodNutrition(selectedFood.value.id)

    const newMeal = {
      id: Date.now(),
      spoonacularId: selectedFood.value.id,
      name: selectedFood.value.name || selectedFood.value.title,
      servings: mealServings.value,
      calories: nutrition.calories * mealServings.value,
      protein: nutrition.protein * mealServings.value,
      carbs: nutrition.carbs * mealServings.value,
      fat: nutrition.fat * mealServings.value,
      date: selectedDateStr.value,
      timestamp: new Date().toISOString()
    }

    // Add to local array immediately for real-time update
    loggedMeals.value.push(newMeal)
    
    // Save to localStorage
    localStorage.setItem('nutritionMeals', JSON.stringify(loggedMeals.value))
    
    // Update charts with new data
    updateCharts()

    // Reset form
    mealName.value = ''
    mealServings.value = 1
    selectedFood.value = null
    showLogButton.value = false
    
    await Swal.fire('Meal Logged!', 'Your meal has been successfully logged.', 'success')
  } catch (error) {
    console.error(error)
    await Swal.fire('Error', 'Failed to log meal. Please try again.', 'error')
  } finally {
    isLogging.value = false
  }
}

async function handleDeleteMeal(meal) {
  const result = await Swal.fire({
    title: 'Confirm Delete',
    text: `Are you sure you want to delete "${meal.name}"? This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel'
  })

  if (!result.isConfirmed) return

  try {
    const success = await deleteMealFromSupabase(meal.id)
    
    if (success) {
      loggedMeals.value = loggedMeals.value.filter(m => m.id !== meal.id)
      updateCharts()
      await Swal.fire('Deleted!', 'Meal has been deleted.', 'success')
    } else {
      loggedMeals.value = loggedMeals.value.filter(m => m.id !== meal.id)
      localStorage.setItem('nutritionMeals', JSON.stringify(loggedMeals.value))
      updateCharts()
      await Swal.fire('Deleted!', 'Meal has been deleted.', 'success')
    }
  } catch (error) {
    console.error(error)
    await Swal.fire('Error', 'Failed to delete meal.', 'error')
  }
}

function onDateSelect(date) {
  selectedDate.value = date
}

function formatDisplayDate(date) {
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

function handleMealInputBlur() {
  setTimeout(() => {
    if (!mealSuggestions.value.length) {
      showLogButton.value = false
    }
  }, 200)
}

function handleServingsBlur() {
  setTimeout(() => {
    showLogButton.value = false
  }, 200)
}

function saveGoals() {
  goals.value = { ...tempGoals.value }
  localStorage.setItem('nutritionGoals', JSON.stringify(goals.value))
  showGoalsModal.value = false
  updateCharts()
}

function initCharts() {
  nextTick(() => {
    if (macroChartCanvas.value) {
      macroChart = new Chart(macroChartCanvas.value, {
        type: 'doughnut',
        data: {
          labels: ['Protein', 'Carbs', 'Fat'],
          datasets: [{
            data: [totals.value.protein || 1, totals.value.carbs || 1, totals.value.fat || 1],
            backgroundColor: ['#f5576c', '#00f2fe', '#fee140'],
            borderColor: '#fff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              position: 'bottom',
              labels: {
                padding: 10,
                font: {
                  size: window.innerWidth < 576 ? 10 : 12
                }
              }
            }
          }
        }
      })
    }

    if (progressChartCanvas.value) {
      progressChart = new Chart(progressChartCanvas.value, {
        type: 'bar',
        data: {
          labels: ['Calories', 'Protein', 'Carbs', 'Fat'],
          datasets: [{
            label: '% of Goal',
            data: [calPct.value, protPct.value, carbPct.value, fatPct.value],
            backgroundColor: ['#667eea', '#f5576c', '#00f2fe', '#fee140']
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { 
              beginAtZero: true, 
              max: 150,
              ticks: {
                font: {
                  size: window.innerWidth < 576 ? 9 : 11
                }
              }
            },
            y: {
              ticks: {
                font: {
                  size: window.innerWidth < 576 ? 9 : 11
                }
              }
            }
          },
          plugins: { 
            legend: { display: false }
          }
        }
      })
    }
  })
}

function updateCharts() {
  if (macroChart) {
    macroChart.data.datasets[0].data = [totals.value.protein || 1, totals.value.carbs || 1, totals.value.fat || 1]
    macroChart.update()
  }

  if (progressChart) {
    progressChart.data.datasets[0].data = [calPct.value, protPct.value, carbPct.value, fatPct.value]
    progressChart.update()
  }
}

function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1 })

  nextTick(() => {
    document.querySelectorAll('.fade-in').forEach((el, i) => {
      el.style.setProperty('--delay', `${i * 0.105}s`) 
      observer.observe(el)
    })
  })
}

watch(selectedDate, updateCharts)

watch(viewMode, (newMode) => {
  // Update body attribute for CSS targeting
  document.body.setAttribute('data-view-mode', newMode)
})

onMounted(async () => {
  try {
    // Set initial view mode attribute
    document.body.setAttribute('data-view-mode', viewMode.value)
    
    // Load saved goals
    const savedGoals = localStorage.getItem('nutritionGoals')
    if (savedGoals) {
      goals.value = JSON.parse(savedGoals)
      tempGoals.value = { ...goals.value }
    }
    
    currentUser.value = await getCurrentUser()
    await loadMealsFromSupabase()
    initCharts()
    setupScrollAnimations()
  } catch (error) {
    console.error('Error initializing:', error)
    const saved = localStorage.getItem('nutritionMeals')
    if (saved) {
      try {
        loggedMeals.value = JSON.parse(saved)
      } catch {
        console.warn('Failed to parse saved meals')
      }
    }
    initCharts()
    setupScrollAnimations()
  }
})
</script>

<style scoped>
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #48bb78;
  --danger-color: #f56565;
  --light-bg: #f8f9fa;
}

.nutrition-tracker {
  background-color: var(--light-bg);
  min-height: 100vh;
  padding: 2rem 0;
}

.nutrition-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 1.5rem;
  transition: box-shadow 0.2s ease;
}

.nutrition-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.nutrition-card h5 {
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
}

.calendar-container {
  position: relative;
}

.nutrition-stat {
  text-align: center;
  padding: 1rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: bold;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.25rem;
}

.progress-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.pc-calories { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.pc-protein { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.pc-carbs { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.pc-fat { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }

.chart-container {
  position: relative;
  height: 300px;
  margin-bottom: 2rem;
  min-height: 250px;
}

.form-control, .form-select {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.form-control:focus, .form-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.btn-primary {
  background: linear-gradient(135deg, #5568d3 0%, #653a91 100%) !important;
  border: none !important;
  font-weight: 500;
  transition: all 0.2s ease;
  color: white !important;
  opacity: 1 !important;
  visibility: visible !important;
  display: inline-block !important;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5568d3 0%, #653a91 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  color: white !important;
}

.btn-primary:disabled {
  background: #ccc !important;
  transform: none;
  box-shadow: none;
  opacity: 0.7 !important;
  color: white !important;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.meal-item {
  background: white;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
}

.meal-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.meal-details {
  flex: 1;
}

.delete-btn {
  min-width: 40px;
  height: 40px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-color: #dc3545;
  color: #dc3545;
  background: white;
}

.delete-btn:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.delete-btn svg {
  width: 16px;
  height: 16px;
}

.log-meal-btn {
  min-height: 38px;
  padding: 0.5rem 1rem;
  opacity: 0;
  transform: translateX(-10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.log-meal-btn.show {
  opacity: 1 !important;
  transform: translateX(0);
  visibility: visible !important;
}

.log-meal-btn:disabled {
  opacity: 0.7 !important;
}

.autocomplete-container {
  position: relative;
}

.autocomplete-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.autocomplete-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.autocomplete-item:hover {
  background: var(--light-bg);
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  margin-right: 0.5rem;
}

.loading-spinner-large {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid rgba(102, 126, 234, 0.3);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.alert-custom {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.alert-warning {
  background: #fff3cd;
  color: #664d03;
  border: 1px solid #ffe69c;
}

.tracker-layout {
  display: flex;
  gap: 1rem;
}

.calendar-sidebar {
  width: 300px;
  flex-shrink: 0;
}

.calendar-section {
  width: 100%;
}

.calendar-toggle-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  color: #333;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.calendar-toggle-btn:hover {
  background: var(--light-bg);
  border-color: var(--primary-color);
}

.calendar-toggle-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.calendar-toggle-btn i {
  font-size: 1rem;
}

.calendar-dropdown {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
}

.calendar-header {
  margin-bottom: 1rem;
}

.calendar-header h6 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #333;
}

.selected-date-display {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.main-content {
  flex: 1;
  transition: margin-left 0.3s ease;
}

.hasMeal {
  border: 2px solid #48bb78;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(72, 187, 120, 0.5);
}

.fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  transition-delay: var(--delay, 0s);
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h5 {
  margin: 0;
  font-weight: 600;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin-bottom: 0.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Mode Toggle Styles */
.mode-toggle-card {
  display: none;
  margin-bottom: 1.5rem;
}

.toggle-container {
  position: relative;
  display: flex;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 50px;
  padding: 4px;
  max-width: 400px;
  margin: 0 auto;
}

.toggle-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: #5f6368;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.3s ease;
  position: relative;
  z-index: 2;
  border-radius: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn:hover {
  color: #667eea;
}

.toggle-btn.active {
  color: white;
}

.toggle-slider {
  position: absolute;
  top: 4px;
  left: 4px;
  height: calc(100% - 8px);
  width: calc(50% - 4px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50px;
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.toggle-slider.right {
  transform: translateX(100%);
}

/* Meals view wrapper - hidden on desktop, shown on mobile */
.meals-view-wrapper {
  display: none;
}

.calendar-sidebar-responsive {
  display: none;
}

/* Logged meals in form (compact style) */
.logged-meals-in-form {
  border-top: 2px solid #e0e0e0;
  padding-top: 1rem;
}

.logged-meals-in-form h6 {
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
}

.empty-state-compact {
  text-align: center;
  padding: 2rem 1rem;
  color: #999;
}

.loading-spinner-small {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(102, 126, 234, 0.3);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 0.8s linear infinite;
  margin-bottom: 0.5rem;
}

.meals-scroll-container {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.meals-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.meals-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.meals-scroll-container::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 10px;
}

.meals-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #5568d3;
}

.meal-item-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid var(--primary-color);
  transition: all 0.2s ease;
}

.meal-item-compact:hover {
  background: #e9ecef;
  transform: translateX(2px);
}

.meal-content {
  flex: 1;
  min-width: 0;
}

.meal-name {
  display: block;
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meal-info {
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-delete-compact {
  background: none;
  border: none;
  color: #dc3545;
  padding: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
}

.btn-delete-compact:hover {
  background: #dc3545;
  color: white;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-outline-primary {
  background: white;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
}

.btn-outline-primary:hover {
  background: var(--primary-color);
  color: white;
}

@media (max-width: 969px) {
  .progress-circle {
    width: 70px;
    height: 70px;
    font-size: 1rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .nutrition-tracker {
    padding: 1rem 0;
  }

  .nutrition-card {
    padding: 1rem;
  }

  .tracker-layout {
    flex-direction: column;
  }

  .calendar-sidebar {
    width: 100%;
  }

  .calendar-dropdown {
    margin-top: 0.5rem;
  }

  .meal-details {
    font-size: 0.9rem;
  }

  .meal-details .small {
    font-size: 0.8rem;
  }
  
  .chart-container {
    height: 250px;
    min-height: 200px;
  }

  /* Show toggle on medium screens */
  .mode-toggle-card {
    display: block;
  }

  /* Hide desktop calendar sidebar on tablets */
  .calendar-sidebar {
    display: none;
  }

  /* Show responsive meals view wrapper */
  .meals-view-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    align-items: start;
  }

  .calendar-sidebar-responsive {
    display: block;
  }
  /* Compact calendar styling for medium screens */
  .calendar-sidebar-responsive .calendar-dropdown {
    padding: 1rem;
  }

  .calendar-sidebar-responsive .calendar-header {
    display: none;
  }

  .calendar-sidebar-responsive .calendar-header small {
    font-size: 0.75rem;
    display: block;
    line-height: 1.3;
  }

  .calendar-sidebar-responsive .selected-date-display {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
  }

  .calendar-sidebar-responsive .selected-date-display small {
    font-size: 0.75rem;
  }

  /* Make calendar more compact */
  .calendar-sidebar-responsive .calendar-container {
    margin-top: 0.75rem;
  }

  /* Scale down calendar content */
  .calendar-sidebar-responsive :deep(.mini-calendar) {
    font-size: 0.85rem;
  }

  .calendar-sidebar-responsive :deep(.calendar-header) {
    padding: 0.5rem;
  }

  .calendar-sidebar-responsive :deep(.calendar-grid) {
    gap: 2px;
  }

  .calendar-sidebar-responsive :deep(.calendar-day) {
    padding: 0.4rem;
    font-size: 0.8rem;
  }

  .calendar-sidebar-responsive :deep(.weekday-header) {
    font-size: 0.7rem;
    padding: 0.3rem;
  }
  /* Make both cards same height with scrollable content */
  .scrollable-card {
    height: 500px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .scrollable-card .calendar-dropdown {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
  }

  .scrollable-card .calendar-header {
    flex-shrink: 0;
    margin-bottom: 1rem;
  }

  .scrollable-card .selected-date-display {
    flex-shrink: 0;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
  }

  .scrollable-card .calendar-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 0.5rem;
    margin-top: 0.5rem;
  }

  .scrollable-card .meals-section {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .scrollable-card .meals-section h5 {
    flex-shrink: 0;
  }

  .meals-list-container {
    flex: 1;
    overflow-y: auto;
    padding-right: 0.5rem;
  }

  .meals-list-container::-webkit-scrollbar,
  .scrollable-card .calendar-container::-webkit-scrollbar {
    width: 6px;
  }

  .meals-list-container::-webkit-scrollbar-track,
  .scrollable-card .calendar-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }

  .meals-list-container::-webkit-scrollbar-thumb,
  .scrollable-card .calendar-container::-webkit-scrollbar-thumb {
    background: #667eea;
    border-radius: 10px;
  }

  .meals-list-container::-webkit-scrollbar-thumb:hover,
  .scrollable-card .calendar-container::-webkit-scrollbar-thumb:hover {
    background: #5568d3;
  }

  /* Control visibility based on view mode */
  body[data-view-mode="log"] .meals-view-wrapper {
    display: none !important;
  }

  body[data-view-mode="meals"] .log-meal-section {
    display: none !important;
  }

  body[data-view-mode="log"] .log-meal-section {
    display: block !important;
  }
  
}

@media (max-width: 576px) {
  .modal-content {
    max-width: 100%;
    margin: 0 1rem;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }

  /* Stack everything vertically on small screens */
  .meals-view-wrapper {
    display: flex !important;
    flex-direction: column;
  }

  .calendar-sidebar-responsive {
    width: 100%;
  }

  .toggle-btn {
    font-size: 13px;
    padding: 10px 16px;
  }

  .toggle-btn svg {
    width: 16px;
    height: 16px;
  }
}
</style>