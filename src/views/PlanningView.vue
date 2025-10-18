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
        <!-- History Search Card -->
        <div class="search-history-card mb-4" v-if="showHistorySearch">
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
              <div class="current-week-container">
                <i class="bi bi-calendar-week calendar-icon" @click="toggleCalendarDropdown"></i>
                <span class="current-week" @click="toggleCalendarDropdown">{{ currentWeekDisplay }}</span>
                <!-- Calendar Dropdown -->
                <div v-if="showCalendarDropdown" class="calendar-dropdown">
                  <div class="dropdown-backdrop" @click="showCalendarDropdown = false"></div>
                  <div class="dropdown-content">
                    <div class="mini-calendar">
                      <div class="mini-calendar-header">
                        <button @click="changeMonth(-1)" class="month-nav-btn">
                          <i class="bi bi-chevron-left"></i>
                        </button>
                        <span class="current-month-year">{{ miniCalendarMonthYear }}</span>
                        <button @click="changeMonth(1)" class="month-nav-btn">
                          <i class="bi bi-chevron-right"></i>
                        </button>
                      </div>
                      <div class="mini-calendar-weekdays">
                        <div v-for="day in ['S', 'M', 'T', 'W', 'T', 'F', 'S']" :key="day" class="weekday-label">
                          {{ day }}
                        </div>
                      </div>
                      <div class="mini-calendar-days">
                        <div
                          v-for="day in miniCalendarDays"
                          :key="day.dateStr"
                          :class="['mini-calendar-day', {
                            'today': day.isToday,
                            'selected': day.isSelected,
                            'current-month': day.isCurrentMonth,
                            'other-month': !day.isCurrentMonth
                          }]"
                          @click="selectDate(day.date)"
                        >
                          {{ day.day }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
              <button @click="generateShoppingList" class="btn btn-success">
                <i class="bi bi-cart-plus me-2"></i>
                Generate Shopping List
              </button>
              <button @click="toggleHistorySearch" class="btn btn-outline-secondary ms-2">
                <i class="bi bi-clock-history me-2"></i>
                {{ showHistorySearch ? 'Hide' : 'Show' }} History
              </button>
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
          
          <div class="modal-header-custom">
            <h3>Plan Meal</h3>
            <p class="text-muted">{{ selectedMealType }} on {{ formatDate(selectedDate) }}</p>
          </div>
          
          <div class="modal-body-custom">
            <!-- Search Toggle -->
            <div class="mb-3">
              <div class="btn-group w-100" role="group">
                <button 
                  type="button" 
                  :class="['btn', searchMode === 'saved' ? 'btn-primary' : 'btn-outline-primary']"
                  @click="searchMode = 'saved'"
                >
                  <i class="bi bi-bookmark-heart me-1"></i>
                  Saved Recipes
                </button>
                <button 
                  type="button" 
                  :class="['btn', searchMode === 'search' ? 'btn-primary' : 'btn-outline-primary']"
                  @click="searchMode = 'search'"
                >
                  <i class="bi bi-search me-1"></i>
                  Search Online
                </button>
              </div>
            </div>

            <!-- Saved Recipes Mode -->
            <div v-if="searchMode === 'saved'" class="saved-mode">
              <div class="mb-3">
                <label class="form-label">Select from Saved Recipes</label>
                <select v-model="selectedRecipeId" class="form-select" required>
                  <option value="">Choose a recipe...</option>
                  <option v-for="recipe in savedRecipes" :key="recipe.id" :value="recipe.id">
                    {{ recipe.title }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Search Online Mode -->
            <div v-if="searchMode === 'search'" class="search-mode">
              <div class="mb-3">
                <label class="form-label">Search for Recipes</label>
                <div class="input-group">
                  <input 
                    v-model="onlineSearchQuery"
                    type="text" 
                    class="form-control" 
                    placeholder="Search recipes online..."
                    @keyup.enter="searchOnlineRecipes"
                  >
                  <button 
                    @click="searchOnlineRecipes"
                    class="btn btn-primary"
                    :disabled="loadingSearch"
                  >
                    <span v-if="loadingSearch" class="spinner-border spinner-border-sm me-1"></span>
                    <i v-else class="bi bi-search me-1"></i>
                    Search
                  </button>
                </div>
              </div>

              <!-- Loading -->
              <div v-if="loadingSearch" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Searching...</span>
                </div>
                <p class="text-muted mt-2">Searching recipes...</p>
              </div>

              <!-- Search Results -->
              <div v-else-if="searchResults.length > 0" class="search-results">
                <h6 class="mb-3">Search Results ({{ searchResults.length }})</h6>
                <div class="results-grid">
                  <div 
                    v-for="recipe in searchResults" 
                    :key="recipe.id"
                    :class="['result-card', { 'selected': selectedOnlineRecipe?.id === recipe.id }]"
                    @click="selectOnlineRecipe(recipe)"
                  >
                    <img 
                      :src="recipe.image" 
                      :alt="recipe.title"
                      class="result-image"
                    >
                    <div class="result-info">
                      <h6 class="result-title">{{ recipe.title }}</h6>
                      <div class="result-meta">
                        <span><i class="bi bi-clock"></i> {{ recipe.readyInMinutes }} min</span>
                        <span><i class="bi bi-heart-fill"></i> {{ recipe.aggregateLikes }}</span>
                      </div>
                    </div>
                    <div v-if="selectedOnlineRecipe?.id === recipe.id" class="selected-indicator">
                      <i class="bi bi-check-circle-fill"></i>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else-if="hasSearched && searchResults.length === 0" class="text-center py-4 text-muted">
                <i class="bi bi-search" style="font-size: 3rem;"></i>
                <p class="mt-2">No recipes found. Try a different search term.</p>
              </div>

              <!-- Initial State -->
              <div v-else class="text-center py-4 text-muted">
                <i class="bi bi-compass" style="font-size: 3rem;"></i>
                <p class="mt-2">Search for recipes online to add to your meal plan</p>
              </div>
            </div>
          </div>
          
          <div class="modal-footer-custom">
            <button @click="closePlanMealModal" class="btn btn-secondary">
              Cancel
            </button>
            <button 
              v-if="getMeal(selectedDate, selectedMealType)"
              @click="removeMeal"
              class="btn btn-danger ms-2"
            >
              <i class="bi bi-trash me-1"></i>
              Remove Meal
            </button>
            <button 
              @click="saveMealPlan" 
              class="btn btn-primary ms-2" 
              :disabled="!canSaveMeal"
            >
              <i class="bi bi-check-circle me-1"></i>
              Save to Plan
            </button>
          </div>
        </div>
      </div>

      <!-- Shopping List Generated Toast -->
      <div v-if="showToast" class="toast-notification">
        <i class="bi bi-check-circle-fill me-2"></i>
        {{ toastMessage }}
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, getCurrentUser } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import axios from 'axios'

const router = useRouter()
const currentUser = ref(null)

const SPOONACULAR_API_KEY = 'c96375c9282445708f1b26ce2d7e04a9'

// State
const currentWeek = ref(new Date())
const mealPlans = ref({}) // { 'YYYY-MM-DD': { breakfast: {...}, lunch: {...}, dinner: {...} } }
const savedRecipes = ref([])
const showPlanMealModal = ref(false)
const selectedDate = ref('')
const selectedMealType = ref('')
const selectedRecipeId = ref('')

// Search mode
const searchMode = ref('saved') // 'saved' or 'search'
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
const showCalendarDropdown = ref(false)
const selectedMonth = ref('')
const miniCalendarDate = ref(new Date())
const highlightedTableDate = ref('')
const isFirstCalendarOpen = ref(true)
const miniCalendarWeekStart = ref(new Date())

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
  const start = weekDays.value[0].date
  const end = weekDays.value[6].date
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} - ${fmt(end)}`
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

const miniCalendarMonthYear = computed(() => {
  return miniCalendarDate.value.toLocaleString('default', { month: 'long', year: 'numeric' })
})

const miniCalendarDays = computed(() => {
  const year = miniCalendarDate.value.getFullYear()
  const month = miniCalendarDate.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const days = []
  const today = new Date()
  // Use miniCalendarWeekStart for consistent highlighting
  const weekStart = new Date(miniCalendarWeekStart.value)

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    const isToday = date.toDateString() === today.toDateString()
    const isSelected = date >= weekStart && date < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) && date.getMonth() === month && date.getFullYear() === year
    const isCurrentMonth = date.getMonth() === month

    days.push({
      date: new Date(date),
      dateStr: formatDateLocal(date),
      day: date.getDate(),
      isToday,
      isSelected,
      isCurrentMonth
    })
  }

  return days
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
  if (showCalendarDropdown.value) {
    // Sync mini calendar with current week
    const currentWeekStart = new Date(currentWeek.value)
    if (isFirstCalendarOpen.value) {
      // First time opening: adjust to highlight the correct week (move back by one day)
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() - 1)
      miniCalendarWeekStart.value = new Date(currentWeekStart)
      isFirstCalendarOpen.value = false
    } else {
      // Subsequent opens: start from Sunday
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay())
      miniCalendarWeekStart.value = new Date(currentWeekStart)
    }
    miniCalendarDate.value = new Date(miniCalendarWeekStart.value)
    // Highlight the current week's start date
    highlightedTableDate.value = formatDateLocal(miniCalendarWeekStart.value)
    // Manually add the class
    nextTick(() => {
      const row = document.querySelector(`tr[data-date="${formatDateLocal(miniCalendarWeekStart.value)}"]`)
      if (row) {
        row.classList.add('highlighted-row')
      }
    })
    setTimeout(() => {
      highlightedTableDate.value = ''
      // Also remove manually
      const row = document.querySelector(`tr[data-date="${formatDateLocal(miniCalendarWeekStart.value)}"]`)
      if (row) {
        row.classList.remove('highlighted-row')
      }
    }, 1000)
  }
}

function changeMonth(direction) {
  const newDate = new Date(miniCalendarDate.value)
  newDate.setMonth(newDate.getMonth() + direction)
  miniCalendarDate.value = newDate
}

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
  }, 1000)

  // Find the start of the week containing this date
  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - date.getDay())
  currentWeek.value = weekStart
  showCalendarDropdown.value = false
}

function planMeal(dateStr, mealType) {
  selectedDate.value = dateStr
  selectedMealType.value = mealType
  
  const existing = getMeal(dateStr, mealType)
  selectedRecipeId.value = existing ? existing.id : ''
  
  // Reset search mode
  searchMode.value = 'saved'
  onlineSearchQuery.value = ''
  searchResults.value = []
  selectedOnlineRecipe.value = null
  hasSearched.value = false
  
  showPlanMealModal.value = true
}

async function searchOnlineRecipes() {
  if (!onlineSearchQuery.value.trim()) return
  
  loadingSearch.value = true
  hasSearched.value = true
  
  try {
    const response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
      params: {
        apiKey: SPOONACULAR_API_KEY,
        query: onlineSearchQuery.value,
        number: 12,
        addRecipeInformation: true,
        fillIngredients: true
      }
    })
    
    searchResults.value = response.data.results || []
    selectedOnlineRecipe.value = null
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
    
    // Optionally save the online recipe to saved_recipes
    await saveOnlineRecipeToDatabase(recipeToSave)
  }
  
  if (!recipeToSave) return
  
  if (!mealPlans.value[selectedDate.value]) {
    mealPlans.value[selectedDate.value] = {}
  }
  
  mealPlans.value[selectedDate.value][selectedMealType.value] = {
    id: recipeToSave.id,
    title: recipeToSave.title,
    image: recipeToSave.image || ''
  }
  
  await saveMealPlansToSupabase()
  closePlanMealModal()
  displayToast(`${recipeToSave.title} added to ${selectedMealType.value}!`)
}

async function saveOnlineRecipeToDatabase(recipe) {
  try {
    // Check if recipe already exists
    const { data: existing } = await supabase
      .from('saved_recipes')
      .select('id')
      .eq('user_id', currentUser.value.id)
      .eq('id', recipe.id)
      .single()
    
    if (!existing) {
      // Save new recipe
      const { error } = await supabase
        .from('saved_recipes')
        .insert({
          id: recipe.id,
          user_id: currentUser.value.id,
          title: recipe.title,
          image: recipe.image || '',
          readyInMinutes: recipe.readyInMinutes || 0,
          servings: recipe.servings || 0,
          aggregateLikes: recipe.aggregateLikes || 0,
          summary: recipe.summary || '',
          instructions: recipe.instructions || '',
          extendedIngredients: recipe.extendedIngredients || [],
          dishTypes: recipe.dishTypes || []
        })
      
      if (error) throw error
      
      // Add to local savedRecipes array
      savedRecipes.value.push(recipe)
    }
  } catch (error) {
    console.error('Error saving recipe:', error)
  }
}

async function removeMeal() {
  if (mealPlans.value[selectedDate.value]) {
    delete mealPlans.value[selectedDate.value][selectedMealType.value]
    
    if (Object.keys(mealPlans.value[selectedDate.value]).length === 0) {
      delete mealPlans.value[selectedDate.value]
    }
  }
  
  await saveMealPlansToSupabase()
  closePlanMealModal()
  displayToast('Meal removed from plan')
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

function toggleHistorySearch() {
  showHistorySearch.value = !showHistorySearch.value
  if (showHistorySearch.value) {
    filterHistory()
  }
}

function filterHistory() {
  const query = historySearch.value.toLowerCase()
  const results = []
  
  Object.keys(mealPlans.value).forEach(dateStr => {
    // Month filter
    if (historyMonth.value) {
      const [y, m] = historyMonth.value.split('-')
      const d = new Date(dateStr)
      if (d.getFullYear() !== Number(y) || (d.getMonth() + 1) !== Number(m)) return
    }
    
    const meals = mealPlans.value[dateStr]
    MEAL_TYPES.forEach(mealType => {
      if (historyMealType.value && historyMealType.value !== mealType) return
      
      if (meals[mealType] && meals[mealType].title) {
        if (!query || meals[mealType].title.toLowerCase().includes(query)) {
          results.push({
            date: dateStr,
            meal: mealType,
            title: meals[mealType].title
          })
        }
      }
    })
  })
  
  // Sort by date desc
  results.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateB - dateA
  })
  
  historyResults.value = results
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

function generateShoppingList() {
  displayToast('Shopping list generated! (Feature coming soon)')
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
        id: plan.recipe_id,
        title: plan.recipe_title,
        image: plan.recipe_image || ''
      }
    })
    
    mealPlans.value = plans
  } catch (error) {
    console.error('Error fetching meal plans:', error)
  }
}

async function saveMealPlansToSupabase() {
  try {
    // Delete all existing meal plans for user
    await supabase
      .from('meal_plans')
      .delete()
      .eq('user_id', currentUser.value.id)
    
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
            recipe_id: meals[mealType].id,
            recipe_title: meals[mealType].title,
            recipe_image: meals[mealType].image
          })
        }
      })
    })
    
    if (planRecords.length > 0) {
      const { error } = await supabase
        .from('meal_plans')
        .insert(planRecords)
      
      if (error) throw error
    }
  } catch (error) {
    console.error('Error saving meal plans:', error)
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
</script>

<style scoped>
.planning-page {
  min-height: 100vh;
  padding-bottom: 4rem;
}

/* Header */
.planning-header {
  background: linear-gradient(135deg, rgba(255, 107, 26, 0.15) 0%, rgba(255, 152, 0, 0.15) 100%);
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.planning-text h1 {
  color: #1a1a1a;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.planning-text p {
  color: #666;
  margin: 0;
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
  color: #1a1a1a;
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
  min-width: 150px;
  justify-content: center;
}

.current-week {
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: color 0.2s;
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

.calendar-dropdown {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: 300px;
}

.dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: -1;
}

.dropdown-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
  width: 280px;
}

.mini-calendar {
  padding: 1rem;
}

.mini-calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.month-nav-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.month-nav-btn:hover {
  background: #f0f0f0;
  color: #ff6b1a;
}

.current-month-year {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 1rem;
}

.mini-calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.weekday-label {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  padding: 0.25rem;
}

.mini-calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

.mini-calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  position: relative;
}

.mini-calendar-day:hover {
  background: #f0f0f0;
}

.mini-calendar-day.today {
  background: rgba(255, 107, 26, 0.1);
  color: #ea580c !important;
  font-weight: 700;
}

.mini-calendar-day.selected {
  background: rgba(255, 107, 26, 0.2);
  color: #ff6b1a;
  font-weight: 700;
}

.mini-calendar-day.selected.today {
  background: rgba(255, 107, 26, 0.15);
  color: #ea580c !important;
  font-weight: 700;
}

.mini-calendar-day.current-month {
  color: #1a1a1a;
}

.mini-calendar-day.other-month {
  color: #ccc;
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