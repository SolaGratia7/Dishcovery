<template>
  <div class="nutrition-tracker">
    <div class="tracker-layout">
      <!-- Calendar Sidebar -->
      <div class="calendar-sidebar">
        <div class="calendar-section">
          <div class="calendar-dropdown">
            <div class="calendar-header">
              <h6>View Nutrition History</h6>
              <small class="text-muted">Click on a date to view nutrition data</small>
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
                @select-date="onDateSelect"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <h2 class="mb-4">Nutrition Tracking</h2>

        <!-- Nutrition Progress Circles -->
        <div class="row mb-4">
          <div class="col-md-3">
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
          <div class="col-md-3">
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
          <div class="col-md-3">
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
          <div class="col-md-3">
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

        <!-- Log Meal Form -->
        <div class="nutrition-card fade-in">
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
                >
                <div v-if="mealSuggestions.length > 0" class="autocomplete-results">
                  <div
                    v-for="suggestion in mealSuggestions"
                    :key="suggestion.id"
                    class="autocomplete-item"
                    @click="selectMeal(suggestion)"
                  >
                    {{ suggestion.name }}
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
                >
              </div>
              <div class="col-6 col-md-4">
                <button type="submit" class="btn btn-primary w-100 log-meal-btn" :disabled="isLogging">
                  <span v-if="!isLogging">Log Meal</span>
                  <span v-else>
                    <span class="loading-spinner"></span>   
                    Logging...
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Today's Meals -->
        <div class="nutrition-card fade-in">
          <h5 class="mb-3">{{ selectedDateStr === todayStr ? "Today's" : selectedDateStr + "'s" }} Meals</h5>
          <div v-if="currentMeals.length === 0" class="empty-state">
            <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">🍽️</div>
            <p>No meals logged yet. Log a meal above!</p>
          </div>
          <div v-else>
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
                  @click="removeMeal(meal.id)"
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import MiniCalendar from './MiniCalendar.vue'


// Constants
const USE_LOCAL_DATABASE = true
const SPOONACULAR_API_KEY = '0ca96dd220c842a6bfdcddfcbcf15b5d'
const API_BASE = 'https://api.spoonacular.com'

// Local databases (from shoppingNutrition.js)
const localFoodsDB = [
  { id: 5001, name: "Grilled Chicken Salad", calories: 350, protein: "35g", carbs: "15g", fat: "18g" },
  { id: 5002, name: "Spaghetti Bolognese", calories: 550, protein: "28g", carbs: "65g", fat: "18g" },
  { id: 5003, name: "Beef Burger", calories: 520, protein: "30g", carbs: "40g", fat: "25g" },
  { id: 5004, name: "Caesar Salad", calories: 380, protein: "15g", carbs: "12g", fat: "32g" },
  { id: 5005, name: "Chicken Stir Fry", calories: 420, protein: "32g", carbs: "45g", fat: "12g" },
  { id: 5006, name: "Salmon with Rice", calories: 480, protein: "35g", carbs: "50g", fat: "15g" },
  { id: 5007, name: "Pizza Margherita", calories: 450, protein: "18g", carbs: "55g", fat: "18g" },
  { id: 5008, name: "Vegetable Curry", calories: 320, protein: "12g", carbs: "48g", fat: "10g" },
  { id: 5009, name: "Beef Tacos", calories: 380, protein: "25g", carbs: "35g", fat: "16g" },
  { id: 5010, name: "Tuna Sandwich", calories: 340, protein: "22g", carbs: "42g", fat: "8g" },
  { id: 5011, name: "Chicken Burrito", calories: 520, protein: "30g", carbs: "58g", fat: "18g" },
  { id: 5012, name: "Greek Salad", calories: 280, protein: "12g", carbs: "15g", fat: "20g" },
  { id: 5013, name: "Pork Fried Rice", calories: 480, protein: "24g", carbs: "62g", fat: "16g" },
  { id: 5014, name: "Chicken Quesadilla", calories: 440, protein: "28g", carbs: "38g", fat: "20g" },
  { id: 5015, name: "Beef Stew", calories: 380, protein: "32g", carbs: "28g", fat: "15g" },
  { id: 5016, name: "Fish and Chips", calories: 620, protein: "28g", carbs: "68g", fat: "28g" },
  { id: 5017, name: "Chicken Wrap", calories: 420, protein: "26g", carbs: "45g", fat: "14g" },
  { id: 5018, name: "Vegetable Lasagna", calories: 380, protein: "18g", carbs: "42g", fat: "16g" },
  { id: 5019, name: "Shrimp Pasta", calories: 460, protein: "28g", carbs: "52g", fat: "14g" },
  { id: 5020, name: "BBQ Chicken", calories: 390, protein: "35g", carbs: "25g", fat: "16g" },
  { id: 5021, name: "Omelette", calories: 280, protein: "20g", carbs: "4g", fat: "20g" },
  { id: 5022, name: "Pancakes", calories: 520, protein: "12g", carbs: "78g", fat: "18g" },
  { id: 5023, name: "French Toast", calories: 480, protein: "14g", carbs: "68g", fat: "16g" },
  { id: 5024, name: "Avocado Toast", calories: 320, protein: "12g", carbs: "38g", fat: "14g" },
  { id: 5025, name: "Smoothie Bowl", calories: 380, protein: "8g", carbs: "72g", fat: "8g" }
]

// Reactive data
const selectedDate = ref(new Date())
const selectedDateStr = computed(() => formatDate(selectedDate.value))
const todayStr = computed(() => formatDate(new Date()))
const showCalendar = ref(false)

const loggedMeals = ref([])
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

function loadMeals() {
  const saved = localStorage.getItem('nutritionMeals')
  if (saved) {
    try {
      loggedMeals.value = JSON.parse(saved)
    } catch {
      console.warn('Failed to parse saved meals')
    }
  }
}

function saveMeals() {
  localStorage.setItem('nutritionMeals', JSON.stringify(loggedMeals.value))
}

async function searchFood(query) {
  if (query.length < 2) return []

  if (USE_LOCAL_DATABASE) {
    const lowerQuery = query.toLowerCase()
    return localFoodsDB.filter(item => item.name.toLowerCase().includes(lowerQuery)).slice(0, 10)
  }

  try {
    const response = await fetch(
      `${API_BASE}/food/menuItems/search?apiKey=${SPOONACULAR_API_KEY}&query=${encodeURIComponent(query)}&number=10`
    )

    if (!response.ok) throw new Error('API request failed')
    const data = await response.json()
    return data.menuItems || []
  } catch (error) {
    console.error('Food search error:', error)
    const lowerQuery = query.toLowerCase()
    return localFoodsDB.filter(item => item.name.toLowerCase().includes(lowerQuery)).slice(0, 10)
  }
}

async function getFoodNutrition(id) {
  if (USE_LOCAL_DATABASE) {
    const found = localFoodsDB.find(f => f.id == id)
    if (!found) return { calories: 0, protein: 0, carbs: 0, fat: 0 }

    return {
      calories: found.calories,
      protein: parseFloat(found.protein.replace('g', '')) || 0,
      carbs: parseFloat(found.carbs.replace('g', '')) || 0,
      fat: parseFloat(found.fat.replace('g', '')) || 0
    }
  }

  try {
    const response = await fetch(
      `${API_BASE}/food/menuItems/${id}?apiKey=${SPOONACULAR_API_KEY}`
    )

    if (!response.ok) throw new Error('API request failed')
    const data = await response.json()

    return {
      calories: data.nutrition?.calories || 0,
      protein: data.nutrition?.protein || 0,
      carbs: data.nutrition?.carbs || 0,
      fat: data.nutrition?.fat || 0
    }
  } catch (error) {
    console.error('Food nutrition error:', error)
    const found = localFoodsDB.find(f => f.id == id)
    if (!found) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    return {
      calories: found.calories,
      protein: parseFloat(found.protein.replace('g', '')) || 0,
      carbs: parseFloat(found.carbs.replace('g', '')) || 0,
      fat: parseFloat(found.fat.replace('g', '')) || 0
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
  mealName.value = suggestion.name
  mealSuggestions.value = []
}

async function logMeal() {
  if (!selectedFood.value) {
    alert('Please select a valid food/meal from the suggestions')
    return
  }

  if (mealServings.value <= 0) {
    alert('Please enter a valid number of servings')
    return
  }

  isLogging.value = true

  try {
    const nutrition = await getFoodNutrition(selectedFood.value.id)

    loggedMeals.value.push({
      id: Date.now(),
      spoonacularId: selectedFood.value.id,
      name: selectedFood.value.name,
      servings: mealServings.value,
      calories: nutrition.calories * mealServings.value,
      protein: nutrition.protein * mealServings.value,
      carbs: nutrition.carbs * mealServings.value,
      fat: nutrition.fat * mealServings.value,
      date: selectedDateStr.value,
      timestamp: new Date().toISOString()
    })

    saveMeals()
    updateCharts()

    // Reset form
    mealName.value = ''
    mealServings.value = 1
    selectedFood.value = null
  } catch (error) {
    alert('Failed to log meal. Please try again.')
    console.error(error)
  } finally {
    isLogging.value = false
  }
}

function removeMeal(id) {
  loggedMeals.value = loggedMeals.value.filter(m => m.id !== id)
  saveMeals()
  updateCharts()
}

function onDateSelect(date) {
  selectedDate.value = date
}

function toggleCalendar() {
  showCalendar.value = !showCalendar.value
}

function formatDisplayDate(date) {
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
  return date.toLocaleDateString('en-US', options)
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
            legend: { position: 'bottom' }
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
            x: { beginAtZero: true, max: 150 }
          },
          plugins: { legend: { display: false } }
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


// Watchers
watch(selectedDate, updateCharts)

// Lifecycle
onMounted(() => {
  loadMeals()
  initCharts()
  setupScrollAnimations()
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
  display: flex;
  justify-content: flex-start;
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
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%) !important;
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
  margin-top: 1rem;
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

@media (max-width: 768px) {
  .progress-circle {
    width: 80px;
    height: 80px;
    font-size: 1.2rem;
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
}

.hasMeal {
  border: 2px solid #48bb78; /* green highlight for logged meals */
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

</style>