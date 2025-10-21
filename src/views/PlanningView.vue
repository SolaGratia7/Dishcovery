  <template>
  <AppLayout>
    <AnimatedBackground />
    
    <div class="planning-page">
      <!-- Header -->
      <div class="planning-header">
        <div class="container">
          <div class="header-content">
            <div class="planning-text">
              <h1>Meal Planner</h1>
              <p>Plan your weekly meals and stay organized</p>
            </div>
          </div>
        </div>
      </div>

      <div class="container my-4">
        <!--Toggle Switch between Manual vs Auto-->
        <div class="mode-toggle-card mb-4">
          <div class="toggle-container">
            <div :class="['toggle-slider', { 'right': planningMode === 'auto' }]"></div>
              <button 
                :class="['toggle-btn', { 'active': planningMode === 'manual' }]"
                @click="planningMode = 'manual'"
              >
                <i class="bi bi-hand-index me-2"></i>
                Manual Planning   
              </button>
              <button 
                :class="['toggle-btn', { 'active': planningMode === 'auto' }]"
                @click="planningMode = 'auto'"
              >
                <i class="bi bi-magic me-2"></i>
                Auto Generate
              </button>
           </div>     
          </div>     
      </div>

        <!-- AUTO GENERATE MODE -->
        <div v-if="planningMode === 'auto'" class="auto-generate-card mb-4">          
          <div class="card-body">
            <div class="row g-3">
              <!-- Week Selection -->
              <div class="col-12">
                <label class="form-label fw-semibold">Select Week to Generate</label>
                <div class="week-selector">
                  <button @click="changeAutoGenWeek(-1)" class="btn btn-sm btn-outline-secondary">
                    <i class="bi bi-chevron-left"></i>
                  </button>
                  <div class="selected-week-display" ref="autoGenCalendarRef">
                    <i class="bi bi-calendar-week me-2"></i>
                    <span @click="toggleAutoGenCalendar">{{ autoGenWeekDisplay }}</span>
                    <MiniCalendar 
                      v-if="showAutoGenCalendar"
                      :current-week="autoGenWeek"
                      :mode="'single'"
                      @select-date="selectAutoGenDate"
                    />
                  </div>
                  <button @click="changeAutoGenWeek(1)" class="btn btn-sm btn-outline-secondary">
                    <i class="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>              
              <!-- Goal Input -->
              <div class="col-12">
                <label class="form-label fw-semibold">What's your goal?</label>
                  <div class="goal-builder">
                    <span class="goal-text">I want to</span>
                    
                    <!-- Lose/Gain Toggle -->
                    <div class="goal-toggle">
                      <button 
                        :class="['goal-toggle-btn', { 'active': goalType === 'lose' }]"
                        @click="goalType = 'lose'"
                      >
                        lose
                      </button>
                      <button 
                        :class="['goal-toggle-btn', { 'active': goalType === 'gain' }]"
                        @click="goalType = 'gain'"
                      >
                        gain
                      </button>
                    </div>
                    
                    <!-- Weight Input -->
                    <input 
                      v-model.number="weightChange"
                      type="number" 
                      class="goal-input"
                      placeholder="3"
                      min="0.5"
                      max="20"
                      step="0.5"
                    >
                    <span class="goal-text">kg in</span>
                    
                    <!-- Timeframe Input -->
                    <input 
                      v-model.number="timeframe"
                      type="number" 
                      class="goal-input"
                      placeholder="1"
                      min="1"
                      max="12"
                    >
                    <span class="goal-text">month(s)</span>
                  </div>
                </div>

              <!-- Diet Preference -->
              <div class="col-md-6">
                <label class="form-label fw-semibold">Diet Preference (optional)</label>
                <select v-model="autoGenDiet" class="form-select">
                  <option value="">No Preference</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="ketogenic">Keto</option>
                  <option value="paleo">Paleo</option>
                  <option value="gluten free">Gluten Free</option>
                </select>
              </div>

              <!-- Excluded Ingredients -->
              <div class="col-md-6">
                <label class="form-label fw-semibold">Exclude Ingredients (optional)</label>
                <input 
                  v-model="autoGenExclude" 
                  type="text" 
                  class="form-control" 
                  placeholder="e.g., nuts, shellfish"
                >
              </div>
            </div>

            <!-- Generate Button -->
            <div class="mt-4">
              <button 
                @click="generateAutoMealPlan(calculatedCalories)" 
                class="btn btn-primary btn-lg w-100"
                :disabled="loadingAutoGen"
              >
                <span v-if="loadingAutoGen" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-magic me-2"></i>
                {{ loadingAutoGen ? 'Generating Your Meal Plan...' : 'Generate Meal Plan' }}
              </button>
            </div>

            <!-- Progress Indicator -->
            <div v-if="loadingAutoGen" class="mt-3">
              <div class="progress-info text-center mb-2">
                <small class="text-muted">{{ autoGenProgress }}</small>
              </div>
              <div class="progress">
                <div 
                  class="progress-bar progress-bar-striped progress-bar-animated" 
                  :style="{ width: autoGenPercent + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>      

      <!--Manual Mode-->
      <div v-if="planningMode === 'manual' || (planningMode === 'auto' && hasGeneratedPlan)">
        <!-- History Search Card -->
        <div class="search-history-card mb-4" v-if="planningMode === 'manual' && showHistorySearch">
          <div class="card-body">
            <div class="row g-2 align-items-center">
              <div class="col-md-6">
                <input 
                  v-model="historySearch"
                  type="text" 
                  class="form-control" 
                  placeholder="Search meal history by recipe name..."
                  @keyup.enter="filterHistory"
                >
              </div>
              <div class="col-auto">
                <select v-model="historyMonth" class="form-select">
                  <option value="">All months</option>
                  <option v-for="month in availableMonths" :key="month.value" :value="month.value">
                    {{ month.label }}
                  </option>
                </select>
              </div>
              <div class="col-auto">
                <select v-model="historyMealType" class="form-select">
                  <option value="">All meals</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
              <div class="col-auto">
                <button @click="filterHistory" class="btn btn-primary">
                  <i class="bi bi-search me-1"></i>
                  Filter
                </button>
              </div>
            </div>
            
            <!-- History Results -->
            <div v-if="historyResults.length > 0" class="history-results mt-3">
              <div 
                v-for="result in historyResults" 
                :key="`${result.date}-${result.meal}`"
                class="history-item"
                @click="jumpToMeal(result.date, result.meal)"
              >
                <strong>{{ result.title }}</strong> — {{ result.meal }} on {{ formatHistoryDate(result.date) }}
              </div>
            </div>
            <div v-else-if="historySearch || historyMonth || historyMealType" class="text-muted mt-2">
              No history found for these filters.
            </div>
          </div>
        </div>

        <!-- Weekly Planner Card -->
        <div class="planner-card">
          <div class="card-header-custom">
            <span class="header-title">Weekly Meal Planner</span>
            <div class="week-nav">
              <button @click="changeWeek(-1)" class="btn btn-sm btn-secondary">
                <i class="bi bi-chevron-left"></i>
              </button>
              <div class="current-week-container" ref="calendarContainerRef">
                <i class="bi bi-calendar-week calendar-icon" @click="toggleCalendarDropdown"></i>
                <span class="current-week" @click="toggleCalendarDropdown">{{ currentWeekDisplay }}</span>
                <!-- Use the new component -->
                <MiniCalendar
                  v-if="showCalendarDropdown"
                  :current-week="currentWeek"
                  :mode="'range'"
                  dropdown-position="below"
                  @select-date="selectDate"
                />
              </div>
              <button @click="changeWeek(1)" class="btn btn-sm btn-secondary">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
          
          <div class="card-body">
            <div class="table-responsive">
              <table class="meal-planner-table">
                <thead>
                  <tr>
                    <th class="day-col">Day</th>
                    <th class="meal-col">Breakfast</th>
                    <th class="meal-col">Lunch</th>
                    <th class="meal-col">Dinner</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(day) in weekDays" :key="day.dateStr" :class="{ 'highlighted-row': highlightedTableDate.value === day.dateStr }" :data-date="day.dateStr">
                    <td class="day-cell">
                      <strong>{{ day.name }}</strong><br>
                      <small class="text-muted">{{ day.dateDisplay }}</small>
                    </td>
                    <td
                      v-for="mealType in ['breakfast', 'lunch', 'dinner']"
                      :key="mealType"
                      class="meal-cell"
                    >
                      <div
                        :id="`slot-${day.dateStr}-${mealType}`"
                        :class="['meal-slot', { 'empty': !getMeal(day.dateStr, mealType), 'highlight': isHighlighted(day.dateStr, mealType) }]"
                        @click="planMeal(day.dateStr, mealType)"
                      >
                        <div v-if="getMeal(day.dateStr, mealType)" class="meal-content">
                          <img
                            :src="getMeal(day.dateStr, mealType).image"
                            :alt="getMeal(day.dateStr, mealType).title"
                            class="meal-image"
                            @error="handleImageError"
                          >
                          <span class="meal-title">{{ getMeal(day.dateStr, mealType).title }}</span>
                        </div>
                        <span v-else class="plus-sign">+</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="mt-4">
              <ShoppingGen :current-week="currentWeek" />
            </div>
          </div>
        </div>
      </div>

      <!-- Plan Meal Modal -->
      <div v-if="showPlanMealModal" class="modal-overlay" @click="closePlanMealModal">
        <div class="modal-content-custom modal-large" @click.stop>
          <button @click="closePlanMealModal" class="btn-close-modal">
            <i class="bi bi-x-lg"></i>
          </button>       
        </div>
      </div>

      <!-- Recipe Details Modal (NEW) -->
      <RecipeModal 
        :recipe="selectedRecipeForView" 
        @close="closeRecipeModal" 
      />         
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, getCurrentUser } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import RecipeModal from '@/components/RecipeModal.vue'
import MiniCalendar from '@/components/MiniCalendar.vue'
import ShoppingGen from '@/components/ShoppingGen.vue'
import axios from 'axios'

const router = useRouter()
const currentUser = ref(null)
const showRecipeModal = ref(false)
const selectedRecipeForView = ref(null)

const SPOONACULAR_API_KEY = [
  '0ca96dd220c842a6bfdcddfcbcf15b5d',
  'c96375c9282445708f1b26ce2d7e04a9',
  '19de6749a5064deea9ebf17f2455d6bb'
].filter(Boolean) // Remove any undefined keys

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

// Planning Mode Toggle
const planningMode = ref('manual')

// Auto Generate State
const goalType = ref('lose')
const weightChange = ref(3)
const timeframe = ref(1)
const autoGenDiet= ref('')
const autoGenExclude = ref('')
const loadingAutoGen = ref(false)
const autoGenProgress = ref('')
const autoGenPercent = ref(0)
const hasGeneratedPlan = ref(false)
const autoGenWeek = ref(new Date())
const showAutoGenCalendar = ref(false)
const autoGenCalendarRef = ref(null)

// State
const currentWeek = ref(new Date())
const mealPlans = ref({})
const savedRecipes = ref([])
const showPlanMealModal = ref(false)
const selectedDate = ref('')
const selectedMealType = ref('')
const selectedRecipeId = ref('')

// Search mode
const SPOONACULAR_URL = 'https://api.spoonacular.com/recipes/complexSearch'
const searchMode = ref('saved')
const onlineSearchQuery = ref('')
const searchResults = ref([])
const selectedOnlineRecipe = ref(null)
const loadingSearch = ref(false)
const hasSearched = ref(false)

// History search
const showHistorySearch = ref(false)
const historySearch = ref('')
const historyMonth = ref('')
const historyMealType = ref('')
const historyResults = ref([])
const highlightedSlot = ref({ date: '', meal: '' })

// Calendar dropdown
const calendarContainerRef = ref(null)
const showCalendarDropdown = ref(false)
const highlightedTableDate = ref('')

// Toast
const showToast = ref(false)
const toastMessage = ref('')

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Computed
const weekDays = computed(() => {
  const startOfWeek = new Date(currentWeek.value)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek)
    date.setDate(date.getDate() + i)
    return {
      name: DAY_NAMES[i],
      date: date,
      dateStr: formatDateLocal(date),
      dateDisplay: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  })
})

const currentWeekDisplay = computed(() => {
  const weekStart = new Date(currentWeek.value)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start from Sunday
  
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6) // End on Saturday
  
  const options = { month: 'short', day: 'numeric' }
  const startStr = weekStart.toLocaleDateString('en-US', options)
  const endStr = weekEnd.toLocaleDateString('en-US', options)
  
  return `${startStr} - ${endStr}`
})

const autoGenWeekDisplay = computed(() => {
  const weekStart = new Date(autoGenWeek.value)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  const options = { month: 'short', day: 'numeric', year: 'numeric' }
  const startStr = weekStart.toLocaleDateString('en-US', options)
  const endStr = weekEnd.toLocaleDateString('en-US', options)
  
  return `${startStr} - ${endStr}`
})

const availableMonths = computed(() => {
  const months = new Set()
  Object.keys(mealPlans.value).forEach(dateStr => {
    const d = new Date(dateStr)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.add(key)
  })
  
  return Array.from(months).sort((a, b) => b.localeCompare(a)).map(m => {
    const [y, mm] = m.split('-')
    const label = new Date(y, Number(mm) - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
    return { value: m, label }
  })
})

const canSaveMeal = computed(() => {
  if (searchMode.value === 'saved') {
    return !!selectedRecipeId.value
  } else {
    return !!selectedOnlineRecipe.value
  }
})

// Helper functions
function formatDateLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatHistoryDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
}

function getMeal(dateStr, mealType) {
  return mealPlans.value[dateStr]?.[mealType]
}

function isHighlighted(dateStr, mealType) {
  return highlightedSlot.value.date === dateStr && highlightedSlot.value.meal === mealType
}

// Actions
function changeWeek(direction) {
  const newWeek = new Date(currentWeek.value)
  newWeek.setDate(newWeek.getDate() + (direction * 7))
  currentWeek.value = newWeek
}

function toggleCalendarDropdown() {
  showCalendarDropdown.value = !showCalendarDropdown.value
}

function handleClickOutside(event) {
  if (showCalendarDropdown.value && 
      calendarContainerRef.value && 
      !calendarContainerRef.value.contains(event.target)) {
    showCalendarDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('click', handleAutoGenClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('click', handleAutoGenClickOutside)
})

function selectDate(date) {
  // Highlight the entire row for the selected date
  const dateStr = formatDateLocal(date)
  highlightedTableDate.value = dateStr

  // Force reactivity update
  nextTick(() => {
    // Check if the row exists
    const row = document.querySelector(`tr[data-date="${dateStr}"]`)
    if (row) {
      row.classList.add('highlighted-row')
    }
  })

  // Remove highlight after 1 second
  setTimeout(() => {
    highlightedTableDate.value = ''
    // Also remove manually
    const row = document.querySelector(`tr[data-date="${dateStr}"]`)
    if (row) {
      row.classList.remove('highlighted-row')
    }
  }, 3000)

  // Find the start of the week containing this date
  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - date.getDay())
  currentWeek.value = weekStart
  showCalendarDropdown.value = false
}

// Computed for validation
const isGoalValid = computed(() => {
  return weightChange.value > 0 && timeframe.value > 0
})

function changeAutoGenWeek(direction) {
  const newWeek = new Date(autoGenWeek.value)
  newWeek.setDate(newWeek.getDate() + (direction * 7))
  autoGenWeek.value = newWeek
}

function toggleAutoGenCalendar() {
  showAutoGenCalendar.value = !showAutoGenCalendar.value
}

function selectAutoGenDate(date) {
  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - date.getDay())
  autoGenWeek.value = weekStart
  showAutoGenCalendar.value = false
}

function handleAutoGenClickOutside(event) {
  if (showAutoGenCalendar.value && 
      autoGenCalendarRef.value && 
      !autoGenCalendarRef.value.contains(event.target)) {
    showAutoGenCalendar.value = false
  }
}

// Computed for calculated calories
const calculatedCalories = computed(() => {
  if (!weightChange.value || !timeframe.value) return 0
  
  const baseCalories = 2000
  const totalCalories = weightChange.value * 7700
  const dailyChange = totalCalories / (timeframe.value * 30)
  
  if (goalType.value === 'lose') {
    return Math.max(1200, Math.round(baseCalories - dailyChange))
  } else if (goalType.value === 'gain') {
    return Math.round(baseCalories + dailyChange)
  }
  
  return baseCalories
})

// Auto Generate Meal Plan
async function generateAutoMealPlan(targetCalories) {
  if (!isGoalValid.value) {
    displayToast('Please enter valid weight and timeframe')
    return
  }

  loadingAutoGen.value = true
  autoGenPercent.value = 0
  hasGeneratedPlan.value = false // Reset before generation
  const generatedPlan = {}
  
  try {
    const dailyCalories = targetCalories
    const breakfastCal = Math.round(dailyCalories * 0.25)
    const lunchCal = Math.round(dailyCalories * 0.35)
    const dinnerCal = Math.round(dailyCalories * 0.40)
    
    const mealTypes = [
      { type: 'breakfast', calories: breakfastCal },
      { type: 'lunch', calories: lunchCal },
      { type: 'dinner', calories: dinnerCal }
    ]
    
    const totalRequests = weekDays.value.length * 3
    let completedRequests = 0

    const autoWeekStart = new Date(autoGenWeek.value)
    autoWeekStart.setDate(autoWeekStart.getDate() - autoWeekStart.getDay())    

    const autoWeekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(autoWeekStart)
      date.setDate(date.getDate() + i)
      return {
        name: DAY_NAMES[i],
        date: date,
        dateStr: formatDateLocal(date),
        dateDisplay: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    })    
    
    for (const day of autoWeekDays) {
      generatedPlan[day.dateStr] = {}
      
      for (const meal of mealTypes) {
        autoGenProgress.value = `Finding ${meal.type} for ${day.name}...`
        autoGenPercent.value = Math.round((completedRequests / totalRequests) * 100)
        
        try {
          const recipe = await autoSearchRecipeForMeal(meal.calories, meal.type)
          
          if (recipe) {
            generatedPlan[day.dateStr][meal.type] = {
              id: recipe.id,
              title: recipe.title,
              image: recipe.image || '',
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
            }
          }
          
          completedRequests++
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          console.error(`Error fetching ${meal.type} for ${day.name}:`, error)
          completedRequests++
        }
      }
    }
    
    autoGenPercent.value = 100
    autoGenProgress.value = 'Meal plan generated successfully!'
    
    // Replace current meal plans
    Object.assign(mealPlans.value, generatedPlan)
    const success = await saveMealPlansToSupabase()
    
    if (success) {
      hasGeneratedPlan.value = true // Set to true after successful generation
      displayToast('Meal plan generated successfully!')
    }
    
    setTimeout(() => {
      loadingAutoGen.value = false
      autoGenPercent.value = 0
      autoGenProgress.value = ''
    }, 1000)
    
  } catch (error) {
    console.error('Error generating meal plan:', error)
    displayToast('Failed to generate meal plan. Please try again.')
    loadingAutoGen.value = false
    autoGenPercent.value = 0
  }
}

async function autoSearchRecipeForMeal(targetCalories, mealType) {
  try {
    const params = {
      number: 5,
      addRecipeInformation: true,
      addRecipeInstructions: true,
      fillIngredients: true,
      minCalories: targetCalories - 100,
      maxCalories: targetCalories + 100,
      sort: 'random'
    }
    
    if (mealType === 'breakfast') {
      params.type = 'breakfast'
    } else if (mealType === 'lunch') {
      params.type = 'main course,salad,soup'
    } else if (mealType === 'dinner') {
      params.type = 'main course'
    }
    
    if (autoGenDiet.value) {
      params.diet = autoGenDiet.value
    }
    
    if (autoGenExclude.value.trim()) {
      params.intolerances = autoGenExclude.value.trim().replace(/,\s*/g, ',')
    }

    const response = await makeApiRequest(params)
    
    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0]
    }
    
    return null
  } catch (error) {
    console.error('Error searching recipe:', error)
    return null
  }
}

async function searchOnlineRecipes(){
  if (!onlineSearchQuery.value.trim()) {
    alert('Please enter a recipe name to search')
    return
  }
  
  loadingSearch.value = true
  hasSearched.value = true
  
  try {
    const params = {
        query: onlineSearchQuery.value,
        number: 12,
        addRecipeInformation: true,
        addRecipeInstructions: true,
        fillIngredients: true
      }

    const response = await makeApiRequest(params)
    searchResults.value = response.data.results || []

    if (searchResults.value.length === 0) {
      alert('No recipes found. Try a different search term!')
    }    
    
  } catch (error) {
    console.error('Error searching recipes:', error)
    displayToast('Failed to search recipes. Please try again.', 'error')
  } finally {
    loadingSearch.value = false
  }
}

function selectOnlineRecipe(recipe) {
  selectedOnlineRecipe.value = recipe
  selectedRecipeId.value = '' // Clear saved recipe selection
}

async function saveMealPlan() {
  let recipeToSave = null
  
  if (searchMode.value === 'saved') {
    if (!selectedRecipeId.value) return
    recipeToSave = savedRecipes.value.find(r => r.id === selectedRecipeId.value)
  } else {
    if (!selectedOnlineRecipe.value) return
    recipeToSave = selectedOnlineRecipe.value
    
  }
  
  if (!recipeToSave) return

  console.log('Recipe to save:', recipeToSave)
  console.log('analyzedInstructions:', recipeToSave.analyzedInstructions)
  console.log('Type:', typeof recipeToSave.analyzedInstructions)  
  
  if (!mealPlans.value[selectedDate.value]) {
    mealPlans.value[selectedDate.value] = {}
  }
  
  mealPlans.value[selectedDate.value][selectedMealType.value] = {
    id: recipeToSave.id,
    title: recipeToSave.title,
    image: recipeToSave.image || '',
    readyInMinutes: recipeToSave.readyInMinutes || 0,
    servings: recipeToSave.servings || 0,
    aggregateLikes: recipeToSave.aggregateLikes || 0,
    summary: recipeToSave.summary || '',
    analyzedInstructions: recipeToSave.analyzedInstructions 
        ? JSON.stringify(recipeToSave.analyzedInstructions)
        : '',
    extendedIngredients: recipeToSave.extendedIngredients || [],
    dishTypes: recipeToSave.dishTypes || []    
  }

  console.log(mealPlans.value[selectedDate.value][selectedMealType.value].extendedIngredients)

  console.log(recipeToSave);
  
  await saveMealPlansToSupabase()
  closePlanMealModal()
  displayToast('Meal added to plan')
}

async function removeMeal() {
  if (mealPlans.value[selectedDate.value]) {
    delete mealPlans.value[selectedDate.value][selectedMealType.value]
    
    if (Object.keys(mealPlans.value[selectedDate.value]).length === 0) {
      delete mealPlans.value[selectedDate.value]
    }
  }
  
  const success = await saveMealPlansToSupabase()
  
  if (success) {
    closePlanMealModal()
    displayToast('Meal removed from plan')
  }
}

function closePlanMealModal() {
  showPlanMealModal.value = false
  selectedDate.value = ''
  selectedMealType.value = ''
  selectedRecipeId.value = ''
  searchMode.value = 'saved'
  onlineSearchQuery.value = ''
  searchResults.value = []
  selectedOnlineRecipe.value = null
  hasSearched.value = false
}

function jumpToMeal(dateStr, mealType) {
  // Clear previous highlight
  highlightedSlot.value = { date: '', meal: '' }
  
  // Set current week to include this date
  const targetDate = new Date(dateStr)
  currentWeek.value = targetDate
  
  // Highlight after render
  setTimeout(() => {
    highlightedSlot.value = { date: dateStr, meal: mealType }
    const slot = document.getElementById(`slot-${dateStr}-${mealType}`)
    if (slot) {
      slot.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
}

function displayToast(message) {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

function handleImageError(event) {
  // Hide the broken image and show a placeholder
  event.target.style.display = 'none'
}

// Supabase functions
async function fetchSavedRecipes() {
  try {
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    savedRecipes.value = data || []
  } catch (error) {
    console.error('Error fetching saved recipes:', error)
  }
}

async function fetchMealPlans() {
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', currentUser.value.id)
    
    if (error) throw error
    
    // Transform to mealPlans object
    const plans = {}
    data?.forEach(plan => {
      if (!plans[plan.date]) {
        plans[plan.date] = {}
      }
      plans[plan.date][plan.meal_type] = {
        id: plan.id,
        title: plan.title,
        image: plan.image || '',
        readyInMinutes: plan.readyInMinutes || 0,
        servings: plan.servings || 0,
        aggregateLikes: plan.aggregateLikes || 0,
        summary: plan.summary || '',
        analyzedInstructions: plan.analyzedInstructions 
            ? JSON.stringify(plan.analyzedInstructions)
            : '',
        extendedIngredients: plan.extendedIngredients || [],
        dishTypes: plan.dishTypes || []          
      }
    })
    
    mealPlans.value = plans
  } catch (error) {
    console.error('Error fetching meal plans:', error)
  }
}

async function saveMealPlansToSupabase() {
  try {  
    // Insert all current meal plans
    const planRecords = []
    
    Object.keys(mealPlans.value).forEach(dateStr => {
      const meals = mealPlans.value[dateStr]
      MEAL_TYPES.forEach(mealType => {
        if (meals[mealType]) {
          planRecords.push({            
            user_id: currentUser.value.id,
            date: dateStr,
            meal_type: mealType,
            id: meals[mealType].id,
            title: meals[mealType].title,
            image: meals[mealType].image,
            readyInMinutes: meals[mealType].readyInMinutes || 0,
            servings: meals[mealType].servings || 0,
            aggregateLikes: meals[mealType].aggregateLikes || 0,
            summary: meals[mealType].summary || '',
            analyzedInstructions: meals[mealType].analyzedInstructions || "",
            extendedIngredients: meals[mealType].extendedIngredients || [],
            dishTypes: meals[mealType].dishTypes || []        
          })
        }
      })
    })
    
    if (planRecords.length > 0) {
      const { error } = await supabase
        .from('meal_plans')
        .upsert(planRecords, {                         
          onConflict: 'user_id,date,meal_type'
        })
      
      if (error) throw error
    }
    return true

  } catch (error) {
    console.error('Error saving meal plans:', error)
    alert('Failed to update meal planner. Please try again.')
    return false
  }
}

// Initialize
onMounted(async () => {
  try {
    currentUser.value = await getCurrentUser()
    await fetchSavedRecipes()
    await fetchMealPlans()
  } catch (error) {
    console.error('Error initializing:', error)
    router.push('/login')
  }
})

function planMeal(dateStr, mealType) {
  // Check if there's already a meal in this slot
  const existingMeal = getMeal(dateStr, mealType)
  
  if (existingMeal) {
    // If meal exists, show recipe details
    selectedRecipeForView.value = existingMeal
    showRecipeModal.value = true
    console.log(existingMeal)
  } else {
    // If no meal, show the plan meal modal to add one
    selectedDate.value = dateStr
    selectedMealType.value = mealType
    showPlanMealModal.value = true
  }
}

function closeRecipeModal() {
  showRecipeModal.value = false
  selectedRecipeForView.value = null
}
</script>

<style scoped>
.planning-page {
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

.planning-text h1 {
  color: #6b46c1;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.planning-text p {
  color: #666;
  margin: 0;
}

/* Toggle Container (Pill Style) */
.toggle-container {
  position: relative;
  display: flex;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 50px;
  padding: 4px;
  max-width: 500px;
  margin: 0 auto;
}

.toggle-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: #5f6368;
  font-size: 16px;
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
  color: #1a73e8;
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
  background: linear-gradient(135deg, #ff6b1a 0%, #ff9800 100%);
  border-radius: 50px;
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.toggle-slider.right {
  transform: translateX(100%);
}

/* Search History Card */
.search-history-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.history-results {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  padding: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: #f8f9fa;
}

.history-item:last-child {
  border-bottom: none;
}

/* Planner Card */
.planner-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
}

.card-header-custom {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 107, 26, 0.1);
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #6b46c1;
}

.week-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.current-week-container {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 180px;
  justify-content: center;
  z-index: 100;
  flex: 1;
}

.current-week {
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: color 0.2s;
  white-space: nowrap;
}

.current-week:hover {
  color: #ff6b1a;
}

.calendar-icon {
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
  margin-right: 0.5rem;
}

.calendar-icon:hover {
  color: #ff6b1a;
}

.card-body {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.3);
}

/* Meal Planner Table */
.meal-planner-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.meal-planner-table th,
.meal-planner-table td {
  padding: 0.75rem;
  text-align: center;
  vertical-align: middle;
}

.day-col {
  width: 18%;
  text-align: left;
}

.meal-col {
  width: 27.333%;
}

.day-cell {
  text-align: left;
}

.meal-cell {
  padding: 0.5rem;
}

.meal-slot {
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.6);
  border: 2px solid rgba(255, 107, 26, 0.1);
}

.meal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.meal-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(255, 107, 26, 0.2);
}

.meal-slot.empty {
  background: rgba(255, 255, 255, 0.4);
}

.meal-slot:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 26, 0.2);
  background: rgba(255, 255, 255, 0.9);
}

.meal-slot.highlight {
  outline: 3px solid #ffcc00;
  background: #fff8e6;
  animation: pulse 1s ease-in-out;
}

.highlighted-row {
  background: rgba(255, 107, 26, 0.1) !important;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(255, 107, 26, 0.3) !important;
  animation: glow 1s ease-in-out;
}

.highlighted-row td:first-child {
  position: relative;
}

.highlighted-row td:first-child::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #ff6b1a;
  z-index: 3;
}

.highlighted-row td {
  background: rgba(255, 107, 26, 0.05) !important;
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 15px rgba(255, 107, 26, 0.3);
  }
  50% {
    box-shadow: 0 0 25px rgba(255, 107, 26, 0.5);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.meal-title {
  font-weight: 600;
  color: #1a1a1a;
  word-break: break-word;
  font-size: 0.875rem;
  line-height: 1.2;
  text-align: center;
}

.plus-sign {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 107, 26, 0.1);
  color: #ff6b1a;
  font-size: 1.5rem;
  font-weight: 300;
  transition: all 0.3s;
}

.meal-slot:hover .plus-sign {
  background: #ff6b1a;
  color: white;
  transform: scale(1.1);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content-custom {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  position: relative;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-content-custom.modal-large {
  max-width: 800px;
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
}

.btn-close-modal:hover {
  background: #f0f0f0;
}

.modal-header-custom {
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header-custom h3 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
}

.modal-body-custom {
  padding: 1.5rem 2rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer-custom {
  padding: 1rem 2rem 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  border-top: 1px solid #f0f0f0;
}

/* Search Mode Styles */
.search-results {
  max-height: 400px;
  overflow-y: auto;
}

.results-grid {
  display: grid;
  gap: 1rem;
}

.result-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.result-card:hover {
  border-color: #ff6b1a;
  box-shadow: 0 4px 12px rgba(255, 107, 26, 0.15);
  transform: translateY(-2px);
}

.result-card.selected {
  border-color: #ff6b1a;
  background: rgba(255, 107, 26, 0.05);
}

.result-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
}

.result-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.result-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.result-meta i {
  color: #ff6b1a;
}

.selected-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 32px;
  height: 32px;
  background: #ff6b1a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.auto-generate-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.week-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 2px solid #e0e0e0;
}

.selected-week-display {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
  min-width: 320px;
  justify-content: center;
  font-weight: 600;
  color: #6b46c1;
}

.selected-week-display span {
  cursor: pointer;
}

.selected-week-display:hover {
  border-color: #6b46c1;
  box-shadow: 0 2px 8px rgba(107, 70, 193, 0.15);
}

.selected-week-display i {
  color: #6b46c1;
}

/* Goal Builder Styles */
.goal-builder {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 2px dashed #e0e0e0;
}

.goal-text {
  font-size: 1.1rem;
  color: #5f6368;
  font-weight: 500;
}

.goal-toggle {
  display: inline-flex;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
}

.goal-toggle-btn {
  padding: 8px 20px;
  border: none;
  background: transparent;
  color: #5f6368;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.goal-toggle-btn:hover {
  background: rgba(107, 70, 193, 0.1);
  color: #6b46c1;
}

.goal-toggle-btn.active {
  background: #6b46c1;
  color: white;
  box-shadow: 0 2px 4px rgba(107, 70, 193, 0.3);
}

.goal-input {
  width: 80px;
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
  transition: all 0.2s;
}

.goal-input:focus {
  outline: none;
  border-color: #6b46c1;
  box-shadow: 0 0 0 3px rgba(107, 70, 193, 0.1);
}

.goal-input::placeholder {
  color: #ccc;
}

/* Responsive */
@media (max-width: 768px) {
  .goal-builder {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .goal-text {
    width: 100%;
  }
}

/* Toast */
.toast-notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #10b981;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  z-index: 9999;
  animation: slideInUp 0.3s ease;
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 992px) {
  .day-col {
    width: 30%;
  }

  .meal-col {
    width: 23.333%;
  }

  .meal-slot {
    min-height: 60px;
    padding: 0.5rem;
    font-size: 0.875rem;
  }

  .week-nav {
    flex-direction: column;
    gap: 0.5rem;
  }

  .current-week {
    font-size: 0.875rem;
  }
}

@media (max-width: 768px) {
  .card-header-custom {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .meal-planner-table th,
  .meal-planner-table td {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
}
</style>