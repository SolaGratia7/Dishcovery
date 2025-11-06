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
            <button @click="isModalOpen = true" class="goal-edit-btn">
              <span>Edit Goal</span>
              <GoalModal 
                :is-open="isModalOpen"
                :goals="goals"
                @close="isModalOpen = false"
                @save="handleSaveGoals"
              />
            </button>            
          </div>
        </div>
      </div>

      <div class="container my-4">
        <!--Nutrition Card-->     
        <div class="row mb-4">
          <div class="col-6 col-md-3 mb-3">
            <NutritionCard
              label="Calories"
              :current="totals.calories"
              :goal="goals.calories"
              unit="calories"
              color="primary"
            />
          </div>
          
          <div class="col-6 col-md-3 mb-3">
            <NutritionCard
              label="Protein"
              :current="totals.protein"
              :goal="goals.protein"
              unit="grams"
              color="secondary"
              :decimals="1"
            />
          </div>
          
          <div class="col-6 col-md-3 mb-3">
            <NutritionCard
              label="Carbs"
              :current="totals.carbs"
              :goal="goals.carbs"
              unit="grams"
              color="accent"
              :decimals="1"
            />
          </div>
          
          <div class="col-6 col-md-3 mb-3">
            <NutritionCard
              label="Fats"
              :current="totals.fats"
              :goal="goals.fats"
              unit="grams"
              color="warning"
              :decimals="1"
            />
          </div>
        </div>
        <!-- Charts Row -->
        <div class="row mb-4">
          <div class="col-lg-6 mb-3 mb-lg-0">
            <NutritionChart
              title="Macro Breakdown"
              subtitle="Today's macronutrient distribution"
              type="doughnut"
              :data="macroChartData"
              :options="macroChartOptions"
            />
          </div>
          <div class="col-lg-6">
            <NutritionChart
              title="Daily Progress"
              subtitle="7-day calorie tracking"
              type="bar"
              :data="progressChartData"
              :options="progressChartOptions"
            />
          </div>
        </div>
        <!-- Mode Toggler -->
        <div class="mode-toggle-card mb-4">
          <div class="toggle-container">
            <div :class="['toggle-slider', { 'right': viewMode === 'search' }]"></div>
            <button
              :class="['toggle-btn', { 'active': viewMode === 'meals' }]"
              @click="setViewMode('meals')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              View Meals
            </button>
            <button
              :class="['toggle-btn', { 'active': viewMode === 'search' }]"
              @click="setViewMode('search')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Search Meal
            </button>
          </div>
        </div>
        <!-- Content based on viewMode -->
        <div v-if="viewMode === 'meals'">
          <!-- Your meals view content -->
          <div class="row mb-4">
            <!--Left calendar-->
            <div class="col-12 col-lg-4 mb-4">
              <div class="calendar-card">
                <div class="calendar-header py-4">
                  <h6>View Nutrition History</h6>
                  <small class="text-muted">Click on a highlighted date to view that day's nutrition</small>
                </div>                
                <MiniCalendar
                  :current-week="selectedDate || new Date()"
                  :selectedDates="[selectedDateStr]"
                  :datesWithMeals="datesWithMeals"  
                  mode="single"
                  class="large-calendar"
                  :auto-close="false"
                  @select-date="onDateSelect"
                />
              </div>
            </div>
            <!---Right calendar-->
            <div class="col-12 col-lg-8 mb-4">
              <div class="nutrition-card meals-section">
                <div v-if="isLoadingMeals" class="empty-state">
                  <span class="loading-spinner-large"></span>
                  <p>Loading meals...</p>
                </div>
                <div v-else-if="currentMeals.length === 0" class="empty-state">
                  <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">🍽️</div>
                  <p>Select a highlighted date to view meals for that day.</p>
                </div>
                <div v-else class="meals-list-container">
                  <div
                    v-for="meal in currentMeals"
                    :key="meal.id"
                    class="meal-item"
                    :class="{ 'meal-unchecked': !meal.included }"
                  >
                    <div class="d-flex align-items-start gap-3">
                      <!-- Checkbox -->
                      <div class="meal-checkbox">
                        <input
                          type="checkbox"
                          :id="`meal-${meal.id}`"
                          v-model="meal.included"
                          @change="recalculateTotals"
                          class="custom-checkbox"
                        />
                        <label :for="`meal-${meal.id}`" class="checkbox-label"></label>
                      </div>

                      <!-- Meal Details -->
                      <div class="meal-details flex-grow-1">
                        <div class="meal-header">
                          <strong>{{ meal.name }}</strong>
                          <span class="meal-type-badge">{{ formatMealType(meal.meal_type) }}</span>
                        </div>
                        <div class="meal-nutrition">
                          <span class="nutrition-item">
                            <span class="dot dot-primary"></span> {{ Math.round(meal.calories) }} cal
                          </span>
                          <span class="nutrition-item">
                            <span class="dot dot-secondary"></span> {{ meal.protein.toFixed(1) }}g protein
                          </span>
                          <span class="nutrition-item">
                            <span class="dot dot-accent"></span> {{ meal.carbs.toFixed(1) }}g carbs
                          </span>
                          <span class="nutrition-item">
                            <span class="dot dot-warning"></span> {{ meal.fats.toFixed(1) }}g fats
                          </span>
                        </div>
                        <div class="small text-muted mt-1">
                          Servings: {{ meal.servings }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>                                             
              </div>
            </div>          
          </div>
          <!-- Your nutrition cards, charts, etc. -->
        </div>
        <div v-if="viewMode === 'search'">
          <!-- Your search view content -->
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

            <!-- Results Count -->
            <div v-if="recipes.length > 0" class="results-info">
              Found {{ recipes.length }} delicious recipe{{ recipes.length !== 1 ? 's' : '' }}
            </div>

            <!-- Recipe Grid -->
            <div v-if="recipes.length > 0" class="recipes-grid">
              <div 
                v-for="recipe in recipes" 
                :key="recipe.id" 
                class="recipe-card"
                :class="{ 'selected': selectedRecipe?.id === recipe.id }"
                @click="selectRecipe(recipe)"
              >
                <!-- Recipe Image -->
                <div class="recipe-image-container">
                  <img
                    :src="recipe.image"
                    :alt="recipe.title"
                    class="recipe-image"
                  >
                </div>

                <!-- Recipe Info -->
                <div class="recipe-info">
                  <h5 class="recipe-title">{{ recipe.title }}</h5>

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
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="!loading" class="empty-state">
              <i class="bi bi-search"></i>
              <h3>Want to Know More about Recipes' Nutrition?</h3>
              <p>Search by recipe name to discover meals' nutrition!</p>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="loading-state">
              <div class="spinner-border text-primary"></div>
              <p>Searching for delicious recipes...</p>
            </div>
          <!-- Your search functionality -->
        </div>

        <!-- Nutrition Popup Modal -->
        <div v-if="showNutritionModal" class="modal-overlay" @click="closeNutritionModal">
          <div class="modal-content" @click.stop>
            <button @click="closeNutritionModal" class="btn-close-modal">
              <i class="bi bi-x-lg"></i>
            </button>

            <div v-if="selectedRecipeForNutrition" class="nutrition-modal-body">
              <h3 class="modal-title">
                <i class="bi bi-bar-chart-line-fill me-2"></i>
                {{ selectedRecipeForNutrition.title }} - Nutrition Facts
              </h3>

              <div class="nutrition-popup-grid">
                <div class="nutrition-popup-item calories" v-if="selectedRecipeForNutrition.calories">
                  <div class="nutrition-popup-value">{{ Math.round(selectedRecipeForNutrition.calories) }}</div>
                  <div class="nutrition-popup-label">Calories</div>
                </div>
                <div class="nutrition-popup-item protein" v-if="selectedRecipeForNutrition.protein">
                  <div class="nutrition-popup-value">{{ selectedRecipeForNutrition.protein.toFixed(1) }}g</div>
                  <div class="nutrition-popup-label">Protein</div>
                </div>
                <div class="nutrition-popup-item carbs" v-if="selectedRecipeForNutrition.carbs">
                  <div class="nutrition-popup-value">{{ selectedRecipeForNutrition.carbs.toFixed(1) }}g</div>
                  <div class="nutrition-popup-label">Carbs</div>
                </div>
                <div class="nutrition-popup-item fats" v-if="selectedRecipeForNutrition.fats">
                  <div class="nutrition-popup-value">{{ selectedRecipeForNutrition.fats.toFixed(1) }}g</div>
                  <div class="nutrition-popup-label">Fats</div>
                </div>
              </div>

              <div class="modal-footer">
                <small class="text-muted">Per serving • {{ selectedRecipeForNutrition.servings }} servings</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick  } from 'vue';
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import GoalModal from '@/components/GoalModal.vue';
import NutritionCard from '@/components/NutritionCard.vue';
import NutritionChart from '@/components/NutritionChart.vue';
import MiniCalendar from '@/components/MiniCalendar.vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import dayjs from 'dayjs'

const currentUser = ref(null)

const totals = ref({
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0
})

const goals = ref({
  calories: 2000,
  protein: 150,
  carbs: 250,
  fats: 65
});

const loading = ref(false)
const error = ref(null)
const isModalOpen = ref(false)
const viewMode = ref('meals') 

const searchQuery = ref('')
const recipes = ref([])
const selectedRecipe = ref(null)
const showNutritionModal = ref(false)
const selectedRecipeForNutrition = ref(null)
const addedNutrition = ref(null)

const SPOONACULAR_URL = 'https://api.spoonacular.com/recipes/complexSearch'

const SPOONACULAR_API_KEY = [
  import.meta.env.VITE_SPOONACULAR_KEY_1,
  import.meta.env.VITE_SPOONACULAR_KEY_2,
  import.meta.env.VITE_SPOONACULAR_KEY_3,
  import.meta.env.VITE_SPOONACULAR_KEY_4, 
  import.meta.env.VITE_SPOONACULAR_KEY_5, 
]

let currentKeyIndex = 0

// Nutrition Chart
const chartLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const dailyCalories = ref([0, 0, 0, 0, 0, 0, 0])

// Dates
const selectedDate = ref(new Date())
function formatDateLocal(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const selectedDateStr = computed(() => {
  return formatDateLocal(selectedDate.value)

})
const todayStr = computed(() => {
  return formatDateLocal(new Date())
})

// Meals data
const currentMeals = ref([])
const isLoadingMeals = ref(false)
const datesWithMeals = ref([]) // For calendar highlighting

// Get current user
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  currentUser.value = user
}

// Load nutrition goals from Supabase
async function getNutritionFromSupabase() {
  loading.value = true
  error.value = null
  
  try {
    // Make sure we have a user
    if (!currentUser.value) {
      await getCurrentUser()
    }

    if (!currentUser.value) {
      throw new Error('No user logged in')
    }

    const { data, error: fetchError } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .single() // Expect 1 row per user

    if (fetchError) {
      // If no goals found (PGRST116 is "no rows returned"), use defaults
      if (fetchError.code === 'PGRST116') {
        console.log('No goals found, using defaults')
        return
      }
      throw fetchError
    }

    if (data) {
      goals.value = {
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fats: data.fats
      }
      console.log('Goals loaded:', goals.value)
    }
  } catch (err) {
    error.value = err.message
    console.error('Error fetching nutrition goals:', err)
  } finally {
    loading.value = false
  }
}

// Save goals to Supabase
async function saveGoalsToSupabase(newGoals) {
  loading.value = true
  error.value = null
  
  try {
    if (!currentUser.value) {
      await getCurrentUser()
    }

    if (!currentUser.value) {
      throw new Error('No user logged in')
    }

    // Check if user already has goals
    const { data: existingGoals } = await supabase
      .from('nutrition_goals')
      .select('id')
      .eq('user_id', currentUser.value.id)
      .single()

    if (existingGoals) {
      // UPDATE existing goals
      const { error: updateError } = await supabase
        .from('nutrition_goals')
        .update({
          calories: newGoals.calories,
          protein: newGoals.protein,
          carbs: newGoals.carbs,
          fats: newGoals.fats,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.value.id)

      if (updateError) throw updateError
      console.log('Goals updated!')
    } else {
      // INSERT new goals
      const { error: insertError } = await supabase
        .from('nutrition_goals')
        .insert({
          user_id: currentUser.value.id,
          calories: newGoals.calories,
          protein: newGoals.protein,
          carbs: newGoals.carbs,
          fats: newGoals.fats
        })

      if (insertError) throw insertError
      console.log('Goals created!')
    }

    // Update local state
    goals.value = { ...newGoals }
  } catch (err) {
    error.value = err.message
    console.error('Error saving goals:', err)
    throw err // Re-throw so handleSaveGoals knows it failed
  } finally {
    loading.value = false
  }
}

// Handle save from modal with SweetAlert2
async function handleSaveGoals(newGoals) {
  // First confirmation
  const confirmation = await Swal.fire({
    title: 'Update Goals?',
    text: `Calories: ${newGoals.calories}, Protein: ${newGoals.protein}g, Carbs: ${newGoals.carbs}g, Fats: ${newGoals.fats}g`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, save it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280'
  })

  // If user cancels, stop here
  if (!confirmation.isConfirmed) {
    return
  }

  try {
    // Show loading while saving
    Swal.fire({
      title: 'Saving...',
      text: 'Updating your nutrition goals',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })

    await saveGoalsToSupabase(newGoals)
    
    // Success message
    await Swal.fire({
      icon: 'success',
      title: 'Goals Saved!',
      text: 'Your nutrition goals have been updated successfully.',
      confirmButtonColor: '#3b82f6',
      timer: 2000
    })
    
  } catch (err) {
    // Error message
    await Swal.fire({
      icon: 'error',
      title: 'Save Failed!',
      text: 'Failed to save goals: ' + (err.message || 'Please try again.'),
      confirmButtonColor: '#ef4444'
    })
  }
}


// Macro Breakdown Chart Data
const macroChartData = computed(() => ({
  labels: ['Fats', 'Carbs', 'Protein'],
  datasets: [{
    data: [totals.value.fats, totals.value.carbs, totals.value.protein],
    backgroundColor: [
      'rgba(239, 68, 68, 0.8)',  // Green for protein
      'rgba(245, 158, 11, 0.8)',  // Orange for carbs
      'rgba(16, 185, 129, 0.8)'    // Red for fats
    ],
    borderColor: [
      'rgba(239, 68, 68, 1)',
      'rgba(245, 158, 11, 1)',
      'rgba(16, 185, 129, 1)'
    ],
    borderWidth: 2
  }]
}));

const macroChartOptions = ref({
  plugins: {
    legend: {
      position: 'bottom'
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.parsed || 0;
          return `${label}: ${value.toFixed(1)}g`;
        }
      }
    }
  }
});

// Daily Progress Chart Data
const progressChartData = computed(() => ({
  labels: chartLabels,
  datasets: [
    {
      label: 'Calories',
      data: dailyCalories.value,
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      borderRadius: 8
    },
    {
      label: 'Goal',
      data: Array(7).fill(goals.value.calories),
      type: 'line',
      borderColor: 'rgba(239, 68, 68, 0.8)',
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 0,
      fill: false
    }
  ]
}))

const progressChartOptions = ref({
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'bottom'
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.dataset.label || '';
          const value = context.parsed.y || 0;
          return `${label}: ${value} cal`;
        }
      }
    }
  }
});

const setViewMode = (mode) => {
  viewMode.value = mode
  localStorage.setItem('viewMode', mode)
}

// Date selected on Calendar
async function onDateSelect(date) {
  selectedDate.value = new Date(date)
  await loadMealsForSelectedDate()
}

function formatMealType(type) {
  if (!type) return 'Meal'
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
}

// Load dates that have meals (for calendar highlighting)
async function loadDatesWithMeals() {
  try {
    if (!currentUser.value) {
      await getCurrentUser()
    }

    const { data, error } = await supabase
      .from('meal_plans')
      .select('date')
      .eq('user_id', currentUser.value.id)

    if (error) throw error

    // Get unique dates
    const uniqueDates = [...new Set(data.map(item => item.date))]
    datesWithMeals.value = uniqueDates

  } catch (error) {
    console.error('Error loading dates with meals:', error)
    datesWithMeals.value = []
  }
}

// Load meals for selected date
async function loadMealsForSelectedDate() {
  isLoadingMeals.value = true
  
  try {
    if (!currentUser.value) {
      await getCurrentUser()
    }

    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .eq('date', selectedDateStr.value)

    if (error) throw error

    console.log(data)

    // Transform data and add 'included' property (all checked by default)
    currentMeals.value = (data || []).map(meal => ({
      id: meal.id, // ✅ Use DB ID or create truly unique one
      name: meal.title,
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fats: meal.fats || 0,
      servings: meal.servings || 1, // ✅ Default to 1, not 0
      meal_type: meal.meal_type,
      date: meal.date,
      included: true // ✅ Checked by default
    }))

    console.log('Loaded meals:', currentMeals.value) // ✅ Logs AFTER assignment

    // Calculate totals from all meals (all checked initially)
    recalculateTotals()

  } catch (err) { // ✅ Renamed to avoid confusion
    console.error('Error loading meals:', err)
    currentMeals.value = []
    totals.value = { calories: 0, protein: 0, carbs: 0, fats: 0 }
  } finally {
    isLoadingMeals.value = false
  }
}

// Recalculate totals based on checked meals only
function recalculateTotals() {
  const includedMeals = currentMeals.value.filter(meal => meal.included)
  
  totals.value = {
    calories: includedMeals.reduce((sum, meal) => sum + meal.calories, 0),
    protein: includedMeals.reduce((sum, meal) => sum + meal.protein, 0),
    carbs: includedMeals.reduce((sum, meal) => sum + meal.carbs, 0),
    fats: includedMeals.reduce((sum, meal) => sum + meal.fats, 0)
  }
}

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
      addRecipeNutrition: true,
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

// Fetch current week from Sunday to Saturday from Supabase
async function fetchWeeklyCalories() {
  if (!currentUser.value) {
    await getCurrentUser()
  }

  const today = dayjs().startOf('day')
  // Find start of current week (Sunday)
  const weekStart = today.startOf('week') // dayjs considers Sunday as start of week by default
  const weekEnd = weekStart.add(6, 'day') // Saturday

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    weekStart.add(i, 'day')
  )

  const { data, error } = await supabase
    .from('meal_plans')
    .select('date, calories')
    .eq('user_id', currentUser.value.id)
    .gte('date', weekStart.format('YYYY-MM-DD'))
    .lte('date', weekEnd.format('YYYY-MM-DD'))

  if (error) {
    console.error('Error fetching meals:', error)
    return
  }

  // Sum calories per day
  const calorieMap = {}
  for (const meal of data) {
    const date = meal.date
    const calories = meal.calories || 0
    calorieMap[date] = (calorieMap[date] || 0) + calories
  }

  // Map results to the current week (fill 0 if none)
  dailyCalories.value = weekDays.map(d =>
    calorieMap[d.format('YYYY-MM-DD')] || 0
  )

  console.log('Current week calories:', dailyCalories.value)
}

function selectRecipe(recipe) {
  // Extract nutrition info (from Spoonacular API response)
  const nutrition = recipe.nutrition?.nutrients || []

  // Helper to find nutrient values by name
  const getNutrient = (name) => {
    const found = nutrition.find(n => n.name.toLowerCase() === name.toLowerCase())
    return found ? found.amount : 0
  }

  selectedRecipeForNutrition.value = {
    title: recipe.title,
    calories: getNutrient('Calories'),
    protein: getNutrient('Protein'),
    carbs: getNutrient('Carbohydrates'),
    fats: getNutrient('Fat'),
    servings: recipe.servings || 1
  }

  // Update totals to show recipe's nutrition in the charts (except daily progress)
  totals.value = {
    calories: selectedRecipeForNutrition.value.calories,
    protein: selectedRecipeForNutrition.value.protein,
    carbs: selectedRecipeForNutrition.value.carbs,
    fats: selectedRecipeForNutrition.value.fats
  }

  showNutritionModal.value = true
}

function closeNutritionModal() {
  showNutritionModal.value = false
  selectedRecipeForNutrition.value = null
}

function resetNutritionCards() {
  totals.value = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  }
}

onMounted(async () => {
  await getCurrentUser()           // Get logged-in user
  await getNutritionFromSupabase()  // Load their goals
  await loadDatesWithMeals()
  await fetchWeeklyCalories()
})
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

/* Goal edit */
.goal-edit-btn {
  background: linear-gradient(135deg, #ff6b1a 0%, #ff9800 100%);
  color: white;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(255, 107, 26, 0.3);
  display: flex;
  align-items: center;
}

/* Container spacing */
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin-left: -0.75rem;
  margin-right: -0.75rem;
}

.col-6,
.col-md-3,
.col-lg-6 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.col-6 {
  flex: 0 0 50%;
  max-width: 50%;
}

/* Mode Toggle */
.mode-toggle-card {
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

@media (min-width: 768px) {
  .col-md-3 {
    flex: 0 0 25%;
    max-width: 25%;
  }
}

@media (min-width: 992px) {
  .col-lg-6 {
    flex: 0 0 50%;
    max-width: 50%;
  }
}

.mb-3 {
  margin-bottom: 1rem;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

.mb-lg-0 {
  margin-bottom: 0;
}

@media (min-width: 992px) {
  .mb-lg-0 {
    margin-bottom: 0 !important;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .goal-edit-btn {
    align-self: flex-end;
  }
}

/* Calendar and Meals */
.calendar-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.calendar-header h6 {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: #1f2937;
}

.nutrition-card.meals-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.dot-primary { 
  background: #3b82f6; /* Blue - matches calories card */
}

.dot-secondary { 
  background: #10b981; /* Green - matches protein card */
}

.dot-accent { 
  background: #f59e0b; /* Orange - matches carbs card */
}

.dot-warning { 
  background: #ef4444; /* Red - matches fats card */
}

.meals-list-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.meal-item {
  padding: 1.25rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s;
}

.meal-item.meal-unchecked {
  opacity: 0.5;
  background: #f3f4f6;
}

.custom-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #f97316;
}

.meal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
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
}

.meal-nutrition {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.nutrition-item {
  font-size: 0.875rem;
  color: #4b5563;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.loading-spinner-large {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top-color: #f97316;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.search-input-group {
  display: flex;
  gap: 0.5rem;
  position: relative;
  align-items: center;
  margin-bottom: 1.5rem;
}

.search-input-group i {
  position: absolute;
  left: 1rem;
  color: #999;
  font-size: 1.1rem;
  z-index: 1;
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
  flex-shrink: 0;
}

.search-btn:hover:not(:disabled) {
  background: #e55f17;
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive adjustments for search bar and button */
@media (max-width: 768px) {
  .search-input-group {
    gap: 0.25rem;
  }

  .search-input {
    padding: 0.5rem 0.75rem 0.5rem 2.5rem;
    font-size: 0.9rem;
  }

  .search-btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}

.results-info {
  margin-bottom: 1.5rem;
   color: #666;
  font-weight: 600;
  text-align: left;
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

.recipe-stats {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 1rem;
}

.recipe-card.selected {
  border: 2px solid #3b82f6;  /* blue highlight */
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transform: scale(1.02);
  transition: all 0.2s ease;
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

/* Nutrition Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
  position: relative;
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

.nutrition-modal-body {
  padding: 3rem 2rem 2rem 2rem;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
  text-align: center;
}

.nutrition-popup-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.nutrition-popup-item {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  border: 2px solid #e9ecef;
  transition: all 0.3s;
}

.nutrition-popup-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.nutrition-popup-value {
  font-size: 2rem;
  font-weight: 700;
  color: #ff6b1a;
  margin-bottom: 0.5rem;
}

/* Color variants for nutrition popup items */
.nutrition-popup-item.calories .nutrition-popup-value {
  color: #3b82f6; /* Blue - matches calories card */
}

.nutrition-popup-item.protein .nutrition-popup-value {
  color: #10b981; /* Green - matches protein card */
}

.nutrition-popup-item.carbs .nutrition-popup-value {
  color: #f59e0b; /* Orange - matches carbs card */
}

.nutrition-popup-item.fats .nutrition-popup-value {
  color: #ef4444; /* Red - matches fats card */
}

.nutrition-popup-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
}

.modal-footer {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

/* Responsive */
@media (max-width: 576px) {
  .modal-overlay {
    padding-top: 80px; /* Account for fixed navbar */
  }

  .modal-content {
    max-width: 100%;
    margin: 0 1rem;
  }

  .nutrition-modal-body {
    padding: 3rem 1.5rem 1.5rem 1.5rem; /* Increased top padding to avoid close button overlap */
  }

  .modal-title {
    font-size: 1.25rem;
  }

  .nutrition-popup-grid {
    grid-template-columns: 1fr;
  }

  .nutrition-popup-value {
    font-size: 1.5rem;
  }
}
</style>
