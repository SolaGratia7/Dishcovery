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


        <!-- AUTO GENERATE MODE -->
        <div v-if="planningMode === 'auto'" class="auto-generate-card mb-4">
          <div class="card-body">
            <div class="row g-3">
              <!-- Date Range Selection -->
              <div class="col-12">
                <label class="form-label fw-semibold">Generate for date(s)</label>
                <div class="date-range-selector">
                  <div class="date-selection-left">
                    <div class="date-input-group">
                      <label class="date-label">Start Date</label>
                      <div class="date-input-wrapper" ref="startDateRef">
                        <input
                          v-model="startDateDisplay"
                          type="text"
                          class="form-control date-input"
                          readonly
                          @click="toggleStartDatePicker"
                          placeholder="Select start date"
                        >
                        <i class="bi bi-calendar date-icon" :class="{ 'd-none': showStartDatePicker }" @click="toggleStartDatePicker"></i>
                      </div>
                    </div>

                    <div class="selection-mode">
                      <div class="mode-toggle">
                        <label class="radio-label">
                          <input
                            type="radio"
                            v-model="selectionMode"
                            value="endDate"
                          >
                          Select End Date
                        </label>
                        <label class="radio-label">
                          <input
                            type="radio"
                            v-model="selectionMode"
                            value="duration"
                          >
                          Select Duration
                        </label>
                      </div>

                      <div v-if="selectionMode === 'endDate'" class="date-input-group">
                        <label class="date-label">End Date</label>
                        <div class="date-input-wrapper" ref="endDateRef">
                          <input
                            v-model="endDateDisplay"
                            type="text"
                            class="form-control date-input"
                            readonly
                            @click="toggleEndDatePicker"
                            placeholder="Select end date"
                          >
                          <i class="bi bi-calendar date-icon" :class="{ 'd-none': showEndDatePicker }" @click="toggleEndDatePicker"></i>
                        </div>
                      </div>

                      <div v-if="selectionMode === 'duration'" class="duration-input-group">
                        <label class="date-label">Duration</label>
                        <div class="duration-inputs">
                          <input
                            v-model.number="durationValue"
                            type="number"
                            class="duration-number"
                            min="1"
                            max="365"
                            placeholder="1"
                          >
                          <select v-model="durationUnit" class="duration-unit">
                            <option value="days">day(s)</option>
                            <option value="weeks">week(s)</option>
                            <option value="months">month(s)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                <div class="calendar-right">
                  <div class="calendar-container">
                    <MiniCalendar
                      :key="selectionMode + (startDate ? startDate.toISOString() : '') + (endDate ? endDate.toISOString() : '')"
                      :current-week="startDate || new Date()"
                      :selected-dates="selectedDateRange"
                      :mode="'range'"
                      class="large-calendar"
                      :auto-close="false"
                      @select-date="handleCalendarDateSelect"
                    />
                  </div>
                </div>
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
                      min="0"
                      max="20"
                      step="0.5"
                    >
                    <span class="goal-text">kg in</span>

                    <!-- Timeframe Input -->
                    <span class="goal-text">{{ goalTimeframeDisplay }}</span>
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
                :disabled="loadingAutoGen || !isDateRangeValid"
              >
                <span v-if="loadingAutoGen" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-magic me-2"></i>
                {{ loadingAutoGen ? 'Generating Your Meal Plan...' : 'Generate Meal Plan' }}
              </button>
              <div v-if="!isDateRangeValid" class="text-danger mt-2 small">
                Please select a valid date range (start date must be before or equal to end date)
              </div>
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
            <!-- Single Day View for Small Screens -->
            <div class="single-day-view" v-if="isSmallScreen">
              <div class="single-day-header">
                <button
                  @click="navigateDay(-1)"
                  class="nav-arrow left-arrow"
                >
                  <i class="bi bi-chevron-left"></i>
                </button>

                <div class="current-day-info">
                  <h4 class="day-name">{{ currentDay.name }}</h4>
                  <p class="day-date">{{ currentDay.dateDisplay }}</p>
                </div>

                <button
                  @click="navigateDay(1)"
                  class="nav-arrow right-arrow"
                >
                  <i class="bi bi-chevron-right"></i>
                </button>
              </div>

              <div class="single-day-meals">
                <div
                  v-for="mealType in ['breakfast', 'lunch', 'dinner']"
                  :key="mealType"
                  class="single-meal-card"
                >
                  <div class="meal-header">
                    <h5 class="meal-type">{{ mealType.charAt(0).toUpperCase() + mealType.slice(1) }}</h5>
                  </div>

                  <div
                    :id="`slot-${currentDay.dateStr}-${mealType}`"
                    :class="['meal-slot-single', { 'empty': !getMeal(currentDay.dateStr, mealType), 'highlight': isHighlighted(currentDay.dateStr, mealType) }]"
                    @click="planMeal(currentDay.dateStr, mealType)"
                  >
                    <div v-if="getMeal(currentDay.dateStr, mealType)" class="meal-content-single">
                      <button
                        class="delete-meal-btn-single"
                        @click.stop="deleteMeal(currentDay.dateStr, mealType)"
                        title="Remove this meal"
                      >
                        <i class="bi bi-trash"></i>
                      </button>

                      <img
                        :src="getMeal(currentDay.dateStr, mealType).image"
                        :alt="getMeal(currentDay.dateStr, mealType).title"
                        class="meal-image-single"
                        @error="handleImageError"
                      >
                      <span class="meal-title-single">{{ getMeal(currentDay.dateStr, mealType).title }}</span>
                    </div>
                    <span v-else class="plus-sign-single">+</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Table Views for Larger Screens -->
            <div class="table-responsive mobile-scroll" v-else>
              <!-- Desktop Table (dates as rows) -->
              <table class="meal-planner-table desktop-table">
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
                          <button
                            class="delete-meal-btn"
                            @click.stop="deleteMeal(day.dateStr, mealType)"
                            title="Remove this meal"
                          >
                            <i class="bi bi-trash"></i>
                          </button>

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

              <!-- Mobile Table (meals as rows, dates as columns) -->
              <table class="meal-planner-table mobile-table">
                <thead>
                  <tr>
                    <th class="meal-col-mobile">Meal</th>
                    <th v-for="(day) in weekDays" :key="day.dateStr" class="day-col-mobile">
                      <strong>{{ getShortDayName(day.name) }}</strong><br>
                      <small class="text-muted">{{ day.dateDisplay }}</small>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="mealType in ['breakfast', 'lunch', 'dinner']" :key="mealType">
                    <td class="meal-col-mobile">
                      <strong>{{ mealType.charAt(0).toUpperCase() + mealType.slice(1) }}</strong>
                    </td>
                    <td
                      v-for="(day) in weekDays"
                      :key="day.dateStr"
                      :class="['meal-cell-mobile', { 'highlighted-row': highlightedTableDate.value === day.dateStr }]"
                      :data-date="day.dateStr"
                    >
                      <div
                        :id="`slot-${day.dateStr}-${mealType}`"
                        :class="['meal-slot-mobile', { 'empty': !getMeal(day.dateStr, mealType), 'highlight': isHighlighted(day.dateStr, mealType) }]"
                        @click="planMeal(day.dateStr, mealType)"
                      >
                        <div v-if="getMeal(day.dateStr, mealType)" class="meal-content-mobile">
                          <button
                            class="delete-meal-btn-mobile"
                            @click.stop="deleteMeal(day.dateStr, mealType)"
                            title="Remove this meal"
                          >
                            <i class="bi bi-trash"></i>
                          </button>

                          <img
                            :src="getMeal(day.dateStr, mealType).image"
                            :alt="getMeal(day.dateStr, mealType).title"
                            class="meal-image-mobile"
                            @error="handleImageError"
                          >
                          <span class="meal-title-mobile">{{ getMeal(day.dateStr, mealType).title }}</span>
                        </div>
                        <span v-else class="plus-sign-mobile">+</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="mt-4">
          <ShoppingGen :current-week="currentWeek" />
        </div>
      </div>

      <!-- Plan Meal Modal -->
      <div v-if="showPlanMealModal" class="modal-overlay" @click="closePlanMealModal">
        <div class="modal-content-custom modal-large" @click.stop>
          <button @click="closePlanMealModal" class="btn-close-modal">
            <i class="bi bi-x-lg"></i>
          </button>

          <div class="modal-header-custom">
            <h3>Add Meal for {{ formatDate(selectedDate) }}</h3>
            <p class="text-muted mb-0">{{ selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1) }}</p>
          </div>

          <div class="modal-body-custom">
            <!-- Search Mode Toggle -->
            <div class="search-mode-toggle mb-4">
              <button
                :class="['search-mode-btn', { 'active': searchMode === 'saved' }]"
                @click="searchMode = 'saved'"
              >
                <i class="bi bi-bookmark me-2"></i>
                Saved Recipes
              </button>
              <button
                :class="['search-mode-btn', { 'active': searchMode === 'online' }]"
                @click="searchMode = 'online'"
              >
                <i class="bi bi-search me-2"></i>
                Search Online
              </button>
            </div>

            <!-- Saved Recipes Mode -->
            <div v-if="searchMode === 'saved'">
              <div class="saved-recipes-section">
                <h5 class="mb-3">Your Saved Recipes</h5>
                <div v-if="savedRecipes.length === 0" class="empty-state">
                  <i class="bi bi-bookmark-x display-4 text-muted"></i>
                  <p class="text-muted mt-2">No saved recipes yet. Search online to find and save recipes!</p>
                </div>
                <div v-else class="saved-recipes-grid">
                  <div
                    v-for="recipe in savedRecipes"
                    :key="recipe.id"
                    :class="['saved-recipe-card', { 'selected': selectedRecipeId === recipe.id }]"
                    @click="selectedRecipeId = recipe.id; selectedOnlineRecipe = null"
                  >
                    <img
                      :src="recipe.image || '/placeholder-recipe.jpg'"
                      :alt="recipe.title"
                      class="recipe-image"
                      @error="handleImageError"
                    >
                    <div class="recipe-info">
                      <h6 class="recipe-title">{{ recipe.title }}</h6>
                      <div class="recipe-meta">
                        <span><i class="bi bi-clock"></i> {{ recipe.readyInMinutes }}min</span>
                        <span><i class="bi bi-people"></i> {{ recipe.servings }}</span>
                      </div>
                    </div>
                    <div v-if="selectedRecipeId === recipe.id" class="selected-indicator">
                      <i class="bi bi-check-lg"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Online Search Mode -->
            <div v-if="searchMode === 'online'">
              <div class="online-search-section">
                <div class="search-input-group mb-3">
                  <input
                    v-model="onlineSearchQuery"
                    type="text"
                    class="form-control search-input"
                    placeholder="Search for recipes..."
                    @keyup.enter="searchOnlineRecipes"
                  >
                  <button
                    @click="searchOnlineRecipes"
                    class="btn btn-primary search-btn"
                    :disabled="loadingSearch"
                  >
                    <span v-if="loadingSearch" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-search me-2"></i>
                    Search
                  </button>
                </div>

                <!-- Search Results -->
                <div v-if="hasSearched" class="search-results">
                  <div v-if="searchResults.length === 0 && !loadingSearch" class="empty-state">
                    <i class="bi bi-search display-4 text-muted"></i>
                    <p class="text-muted mt-2">No recipes found. Try a different search term!</p>
                  </div>
                  <div v-else-if="searchResults.length > 0" class="results-grid">
                    <div
                      v-for="recipe in searchResults"
                      :key="recipe.id"
                      :class="['result-card', { 'selected': selectedOnlineRecipe && selectedOnlineRecipe.id === recipe.id }]"
                      @click="selectOnlineRecipe(recipe)"
                    >
                      <img
                        :src="recipe.image || '/placeholder-recipe.jpg'"
                        :alt="recipe.title"
                        class="result-image"
                        @error="handleImageError"
                      >
                      <div class="result-info">
                        <h6 class="result-title">{{ recipe.title }}</h6>
                        <div class="result-meta">
                          <span><i class="bi bi-clock"></i> {{ recipe.readyInMinutes }}min</span>
                          <span><i class="bi bi-people"></i> {{ recipe.servings }}</span>
                          <span><i class="bi bi-heart"></i> {{ recipe.aggregateLikes }}</span>
                        </div>
                      </div>
                      <div v-if="selectedOnlineRecipe && selectedOnlineRecipe.id === recipe.id" class="selected-indicator">
                        <i class="bi bi-check-lg"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer-custom">
            <button @click="closePlanMealModal" class="btn btn-secondary">
              Cancel
            </button>
            <button
              @click="saveMealPlan"
              class="btn btn-primary"
              :disabled="!canSaveMeal || savingMeal"
            >
              <span v-if="savingMeal" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-plus-circle me-2"></i>
              {{ savingMeal ? 'Adding...' : 'Add Meal' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Recipe Details Modal (NEW) -->
      <RecipeModal
        :recipe="selectedRecipeForView"
        @close="closeRecipeModal"
      />

      <!-- Toast Notification -->
      <div v-if="showToast" class="toast-notification">
        {{ toastMessage }}
      </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, getCurrentUser } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import RecipeModal from '@/components/RecipeModal.vue'
import MiniCalendar from '@/components/MiniCalendar.vue'
import ShoppingGen from '@/components/ShoppingGen.vue'
import axios from 'axios'
import Swal from "sweetalert2"



const router = useRouter()
const currentUser = ref(null)
const showRecipeModal = ref(false)
const selectedRecipeForView = ref(null)

const SPOONACULAR_API_KEY = [
  import.meta.env.VITE_SPOONACULAR_KEY_1,
  import.meta.env.VITE_SPOONACULAR_KEY_2,
  import.meta.env.VITE_SPOONACULAR_KEY_3,
  import.meta.env.VITE_SPOONACULAR_KEY_4, 
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

// Date range selection
const startDate = ref(null)
const endDate = ref(null)
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)
const startDateRef = ref(null)
const endDateRef = ref(null)
const selectedDateRange = computed(() => {
  const dates = []
  if (startDate.value) dates.push(formatDateLocal(startDate.value))

  const effectiveEndDate = selectionMode.value === 'duration' ? endDateFromDuration.value : endDate.value
  if (effectiveEndDate) dates.push(formatDateLocal(effectiveEndDate))

  return dates
})

// Selection mode and duration
const selectionMode = ref('endDate') // 'endDate' or 'duration'
const durationValue = ref(1)
const durationUnit = ref('weeks') // 'days', 'weeks', 'months'

// State
const currentWeek = ref(new Date())
const mealPlans = ref({})
const savedRecipes = ref([])
const showPlanMealModal = ref(false)
const selectedDate = ref('')
const selectedMealType = ref('')
const selectedRecipeId = ref('')
const savingMeal = ref(false)

// Single day view state
const currentDayIndex = ref(0)
const isSmallScreen = ref(false)

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

// Expanded meal slot
const expandedMeal = ref('')

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

// Computed for single day view
const currentDay = computed(() => {
  return weekDays.value[currentDayIndex.value] || weekDays.value[0]
})

const startDateDisplay = computed(() => {
  if (!startDate.value) return ''
  return startDate.value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
})

const endDateDisplay = computed(() => {
  if (!endDate.value) return ''
  return endDate.value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
})

// Computed for end date from duration
const endDateFromDuration = computed(() => {
  if (!startDate.value || !durationValue.value) return null

  const endDate = new Date(startDate.value)
  const value = durationValue.value

  if (durationUnit.value === 'days') {
    endDate.setDate(endDate.getDate() + value - 1) // Subtract 1 to include start date
  } else if (durationUnit.value === 'weeks') {
    endDate.setDate(endDate.getDate() + (value * 7) - 1) // Subtract 1 to include start date
  } else if (durationUnit.value === 'months') {
    endDate.setMonth(endDate.getMonth() + value)
    endDate.setDate(endDate.getDate() - 1) // Subtract 1 to include start date
  }

  return endDate
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

function getShortDayName(dayName) {
  const shortNames = {
    'Sunday': 'Sun',
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat'
  }
  return shortNames[dayName] || dayName
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
  // Reset to first day when changing weeks
  currentDayIndex.value = 0
}

// Single day navigation
function navigateDay(direction) {
  const newIndex = currentDayIndex.value + direction
  if (newIndex < 0) {
    // Go to previous week and set to Saturday
    changeWeek(-1)
    currentDayIndex.value = 6
  } else if (newIndex >= weekDays.value.length) {
    // Go to next week and set to Sunday
    changeWeek(1)
    currentDayIndex.value = 0
  } else {
    currentDayIndex.value = newIndex
  }
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
  document.addEventListener('click', handleDatePickerClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('click', handleDatePickerClickOutside)
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
  // Keep dropdown open for multiple selections if needed
}

// Computed for validation
const isGoalValid = computed(() => {
  return weightChange.value >= 0 && (timeframeDisplay.value || timeframe.value > 0)
})

const isDateRangeValid = computed(() => {
  if (selectionMode.value === 'duration') {
    return startDate.value && durationValue.value > 0
  } else {
    return startDate.value && endDate.value && startDate.value <= endDate.value
  }
})

const calculatedTimeframe = computed(() => {
  const effectiveEndDate = selectionMode.value === 'duration' ? endDateFromDuration.value : endDate.value
  if (!startDate.value || !effectiveEndDate) return 0
  const diffTime = effectiveEndDate.getTime() - startDate.value.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end dates
  return diffDays
})

const timeframeDisplay = computed(() => {
  const days = calculatedTimeframe.value
  if (days === 0) return ''

  // Check for months (within ±2 days of multiples of 30) - only for 30+ days
  if (days >= 28) {
    const months = Math.round(days / 30)
    const expectedDays = months * 30
    if (Math.abs(days - expectedDays) <= 2) {
      return `${months} month${months !== 1 ? 's' : ''}`
    }
  }

  // Show weeks if exactly divisible by 7 and >= 7 days
  if (days >= 7 && days % 7 === 0) {
    const weeks = days / 7
    return `${weeks} week${weeks !== 1 ? 's' : ''}`
  }

  // Otherwise show days
  return `${days} day${days > 1 ? 's' : ''}`
})

const goalTimeframeDisplay = computed(() => {
  // Always show the calculated timeframe in smart units (months/weeks/days)
  return timeframeDisplay.value
})

function toggleStartDatePicker() {
  showStartDatePicker.value = !showStartDatePicker.value
  showEndDatePicker.value = false // Close other picker
}

function toggleEndDatePicker() {
  showEndDatePicker.value = !showEndDatePicker.value
  showStartDatePicker.value = false // Close other picker
}

function selectStartDate(date) {
  startDate.value = new Date(date)
  showStartDatePicker.value = false

  // If end date is before start date, clear it
  if (endDate.value && endDate.value < startDate.value) {
    endDate.value = null
  }

  // If using duration mode, end date will be computed automatically via endDateFromDuration
}

function selectEndDate(date) {
  endDate.value = new Date(date)
  showEndDatePicker.value = false

  // If start date is after end date, clear it
  if (startDate.value && startDate.value > endDate.value) {
    startDate.value = null
  }
}

function handleCalendarDateSelect(dates) {
  if (Array.isArray(dates)) {
    if (dates.length >= 1) {
      startDate.value = new Date(dates[0])
    }
    if (dates.length >= 2) {
      endDate.value = new Date(dates[1])
    }
  } else {
    // Single date selection - update the appropriate date based on which picker is open
    const selectedDate = new Date(dates)
    if (showStartDatePicker.value) {
      startDate.value = selectedDate
      showStartDatePicker.value = false
      // If end date is before start date, clear it
      if (endDate.value && endDate.value < startDate.value) {
        endDate.value = null
      }
    } else if (showEndDatePicker.value) {
      endDate.value = selectedDate
      showEndDatePicker.value = false
      // If start date is after end date, clear it
      if (startDate.value && startDate.value > endDate.value) {
        startDate.value = null
      }
    } else {
      // Fallback: allow range selection
      if (!startDate.value) {
        startDate.value = selectedDate
      } else if (!endDate.value) {
        endDate.value = selectedDate
      } else {
        // Reset and start new selection
        startDate.value = selectedDate
        endDate.value = null
      }
    }
  }

  // If duration mode is selected, update the end date based on duration
  if (selectionMode.value === 'duration' && startDate.value) {
    // endDate will be computed automatically via endDateFromDuration
  }
}

function handleDatePickerClickOutside(event) {
  if (showStartDatePicker.value &&
      startDateRef.value &&
      !startDateRef.value.contains(event.target)) {
    showStartDatePicker.value = false
  }
  if (showEndDatePicker.value &&
      endDateRef.value &&
      !endDateRef.value.contains(event.target)) {
    showEndDatePicker.value = false
  }
}

// Computed for calculated calories
const calculatedCalories = computed(() => {
  if (!weightChange.value) return 0

  // Use calculated timeframe from date range if available, otherwise use manual input
  const effectiveTimeframe = timeframeDisplay.value ? calculatedTimeframe.value / 30 : timeframe.value
  if (!effectiveTimeframe) return 0

  const baseCalories = 2000
  const totalCalories = weightChange.value * 7700
  const dailyChange = totalCalories / (effectiveTimeframe * 30)

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
    await Swal.fire({
      icon: 'error',
      title: 'Invalid Input',
      text: 'Please enter valid weight and timeframe',
      confirmButtonColor: '#6b46c1'
    })
    return
  }

  if (!isDateRangeValid.value) {
    await Swal.fire({
      icon: 'error',
      title: 'Invalid Date Range',
      text: 'Please select a valid date range',
      confirmButtonColor: '#6b46c1'
    })
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

    // Generate dates between start and end date
    const selectedDates = []
    const effectiveEndDate = selectionMode.value === 'duration' ? endDateFromDuration.value : endDate.value
    const currentDate = new Date(startDate.value)
    while (currentDate <= effectiveEndDate) {
      selectedDates.push({
        date: new Date(currentDate),
        dateStr: formatDateLocal(currentDate),
        name: DAY_NAMES[currentDate.getDay()]
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const totalRequests = selectedDates.length * 3
    let completedRequests = 0

    for (const day of selectedDates) {
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
              analyzedInstructions: recipe.analyzedInstructions || '',
              extendedIngredients: recipe.extendedIngredients || [],
              dishTypes: recipe.dishTypes || [],
              vegetarian: recipe.vegetarian || false,
              vegan: recipe.vegan || false,
              glutenFree: recipe.glutenFree || false,

              // ✅ ADD NUTRITION VALUES
              calories: recipe.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 0,
              protein: recipe.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0,
              carbs: recipe.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0,
              fat: recipe.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0,                  
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
      hasGeneratedPlan.value = true
      planningMode.value = 'manual'
      currentWeek.value = new Date(startDate.value)
      
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Meal plan generated successfully!',
        timer: 1500,  // Auto-close after 1.5 seconds
        showConfirmButton: false,
      })
    }

    setTimeout(() => {
      loadingAutoGen.value = false
      autoGenPercent.value = 0
      autoGenProgress.value = ''
    }, 1000)

  } catch (error) {
    console.error('Error generating meal plan:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Generation Failed',
      text: 'Failed to generate meal plan. Please try again.',
      confirmButtonColor: '#6b46c1'
    })
    loadingAutoGen.value = false
    autoGenPercent.value = 0
  }
}

async function deleteMeal(dateStr, mealType) {
  try {
    // 🧩 First confirmation
    const firstConfirm = await Swal.fire({
      title: `Delete ${mealType} for ${dateStr}?`,
      text: "Are you sure you want to remove this meal from your plan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    });

    if (!firstConfirm.isConfirmed) return;

    // 🧹 Remove locally
    if (mealPlans.value[dateStr]) {
      delete mealPlans.value[dateStr][mealType];
      if (Object.keys(mealPlans.value[dateStr]).length === 0) {
        delete mealPlans.value[dateStr];
      }
    }

    // 🧾 Delete from Supabase
    const { error } = await supabase
      .from("meal_plans")
      .delete()
      .eq("user_id", currentUser.value.id)
      .eq("date", dateStr)
      .eq("meal_type", mealType);

    if (error) throw error;

    // ✅ Success message
    await Swal.fire({
      title: "Deleted!",
      text: "Your meal has been removed.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Error deleting meal:", error);
    Swal.fire("Error", "Something went wrong while deleting the meal.", "error");
  }
}


async function autoSearchRecipeForMeal(targetCalories, mealType) {
  try {
    const params = {
      number: 5,
      addRecipeInformation: true,
      addRecipeInstructions: true,
      addRecipeNutrition: true,
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
    console.log(response.data.results[0])

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
        addRecipeNutrition: true,
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
  savingMeal.value = true

  let success = false

  try {
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
      analyzedInstructions: recipeToSave.analyzedInstructions || '',
      extendedIngredients: recipeToSave.extendedIngredients || [],
      dishTypes: recipeToSave.dishTypes || [],

        // ✅ ADD NUTRITION VALUES
        calories: recipeToSave.calories || 0,
        protein: recipeToSave.protein || 0,
        carbs: recipeToSave.carbs || 0,
        fat: recipeToSave.fat || 0      
    }

    console.log(mealPlans.value[selectedDate.value][selectedMealType.value].extendedIngredients)
    console.log(recipeToSave);

    await saveMealPlansToSupabase()
    success = true
  } catch (error) {
    console.error('Error saving meal:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Generation Failed',
      text: 'Failed to generate meal plan. Please try again.',
      confirmButtonColor: '#6b46c1'
    })
  } finally {
    savingMeal.value = false
    if (success) {
      closePlanMealModal()
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Meal added to plan!',
        timer: 1500,  // Auto-close after 2 seconds
        showConfirmButton: false,
      })      
    }
  }
}

function closePlanMealModal() {
  // Only close if not currently saving
  if (savingMeal.value) return

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
        analyzedInstructions: plan.analyzedInstructions || '',
        extendedIngredients: plan.extendedIngredients || [],
        dishTypes: plan.dishTypes || [],

        // ✅ ADD NUTRITION VALUES
        calories: plan.calories || 0,
        protein: plan.protein || 0,
        carbs: plan.carbs || 0,
        fat: plan.fat || 0          
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
            dishTypes: meals[mealType].dishTypes || [],

            // ✅ ADD NUTRITION VALUES
            calories: meals[mealType].calories || 0,
            protein: meals[mealType].protein || 0,
            carbs: meals[mealType].carbs || 0,
            fat: meals[mealType].fat || 0            
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

// Watch for selection mode changes
watch(selectionMode, (newMode) => {
  if (newMode === 'duration') {
    // Clear end date when switching to duration mode
    endDate.value = null
  }
})

// Initialize
onMounted(async () => {
  try {
    currentUser.value = await getCurrentUser()
    await fetchSavedRecipes()
    await fetchMealPlans()

    // Check screen size for responsive behavior
    const checkScreenSize = () => {
      isSmallScreen.value = window.innerWidth < 768
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    // Set current day index to today for small screens on initial load
    if (isSmallScreen.value) {
      const today = new Date()
      currentDayIndex.value = today.getDay()
    }
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
  background: rgba(255, 255, 255, 0.7);
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

@media (max-width: 768px) {
  .header-title {
    text-align: center;
  }
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
  min-height: 60px;
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
.search-mode-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-mode-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  background: white;
  color: #6b7280;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-mode-btn:hover {
  border-color: #ff6b1a;
  color: #ff6b1a;
}

.search-mode-btn.active {
  border-color: #ff6b1a;
  background: #ff6b1a;
  color: white;
}

.saved-recipes-section,
.online-search-section {
  min-height: 300px;
}

.saved-recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.saved-recipe-card {
  display: flex;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  padding: 1rem;
  background: white;
}

.saved-recipe-card:hover {
  border-color: #ff6b1a;
  box-shadow: 0 4px 12px rgba(255, 107, 26, 0.15);
  transform: translateY(-2px);
}

.saved-recipe-card.selected {
  border-color: #ff6b1a;
  background: rgba(255, 107, 26, 0.05);
}

.recipe-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
  margin-right: 1rem;
}

.recipe-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recipe-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
}

.recipe-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.recipe-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.recipe-meta i {
  color: #ff6b1a;
}

.search-input-group {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
}

.search-btn {
  white-space: nowrap;
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.result-card {
  display: flex;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  padding: 1rem;
  background: white;
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
  margin-right: 1rem;
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
  line-height: 1.3;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: #6b7280;
}

.empty-state i {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.auto-generate-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.date-range-selector {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  position: relative;
}

.date-selection-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.selection-mode {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mode-toggle {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b46c1;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  margin: 0;
  accent-color: #6b46c1;
}

.duration-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.duration-inputs {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.duration-number {
  width: 80px;
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
}

.duration-number:focus {
  outline: none;
  border-color: #6b46c1;
  box-shadow: 0 0 0 3px rgba(107, 70, 193, 0.1);
}

.duration-unit {
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1a1a;
  cursor: pointer;
}

.duration-unit:focus {
  outline: none;
  border-color: #6b46c1;
  box-shadow: 0 0 0 3px rgba(107, 70, 193, 0.1);
}

.calendar-right {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 300px; /* Increased to accommodate larger calendar */
}

.calendar-container {
  position: relative;
}

.date-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b46c1;
  margin: 0;
}

.date-input-wrapper {
  position: relative;
}

.date-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1a1a;
  cursor: pointer;
  transition: all 0.2s;
}

.date-input:focus {
  outline: none;
  border-color: #6b46c1;
  box-shadow: 0 0 0 3px rgba(107, 70, 193, 0.1);
}

.date-input::placeholder {
  color: #9ca3af;
}

.date-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b46c1;
  cursor: pointer;
  font-size: 1rem;
  pointer-events: none;
}

/* Calendar dropdown positioning */
.date-input-wrapper {
  position: relative;
  z-index: 10;
}

/* Compact calendar styling */
.large-calendar :deep(.mini-calendar) {
  width: 280px !important; /* Increased from 220px for better visibility */
  padding: 0.6rem !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
  background: white !important;
}

.large-calendar :deep(.calendar-dropdown) {
  border: none !important;
  box-shadow: none !important;
}

.large-calendar :deep(.dropdown-content) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

.large-calendar :deep(.mini-calendar-days) {
  grid-template-columns: repeat(7, 1fr) !important;
}

.large-calendar :deep(.mini-calendar-day) {
  width: 26px !important;
  height: 26px !important;
  font-size: 0.8rem !important;
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

.meal-content {
  position: relative;   /* So .delete-meal-btn positions correctly */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.delete-meal-btn {
  position: absolute;     /* Position relative to meal card */
  top: 6px;               /* Distance from the top */
  right: 6px;             /* Distance from the right */
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.25rem;
  color: #dc2626;         /* Red (Tailwind’s red-600) */
  opacity: 0.8;
  transition: opacity 0.2s ease, transform 0.15s ease;
}

.delete-meal-btn:hover {
  opacity: 1;
  transform: scale(1.2);  /* Slight grow on hover */
}

/* Mobile layout for screens less than 992px */
@media (max-width: 992px) {
  .meal-content {
    position: static; /* Remove relative positioning for mobile */
  }

  .meal-image {
    order: 1;
  }

  .meal-title {
    order: 2;
  }

  .delete-meal-btn {
    position: static; /* Remove absolute positioning */
    order: 3; /* Place below the title */
    margin-top: 0.25rem; /* Add small margin above the button */
    align-self: center; /* Center the button */
  }
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

  .date-range-selector {
    flex-direction: column;
    gap: 1rem;
  }

  .date-selection-left {
    flex-direction: column;
    gap: 1rem;
  }

  .calendar-right {
    min-width: auto;
    align-items: center;
  }

  .mode-toggle {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .duration-inputs {
    flex-wrap: wrap;
  }

  .date-input {
    padding: 0.625rem 2rem 0.625rem 0.875rem;
  }

  .date-icon {
    right: 0.5rem;
    font-size: 0.875rem;
  }

  .date-input-wrapper {
    position: static;
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

/* Mobile Table Styles */
.mobile-table {
  display: none;
  border-spacing: 1rem 0.75rem; /* Increase spacing between cells significantly */
  margin: 1rem 0; /* Add margin around the table */
}

/* Mobile scroll container */
.mobile-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 768px) {
  .mobile-scroll {
    max-width: calc(100vw - 2rem);
  }

  .mobile-table {
    min-width: 800px; /* Force horizontal scroll on small screens, showing ~2 days */
  }
}

.desktop-table {
  display: table;
}

/* Mobile-specific styles */
.meal-col-mobile {
  width: 10%;
  text-align: left;
  font-weight: 600;
  color: #6b46c1;
  padding: 1.5rem 1rem; /* Increase padding significantly */
}

.day-col-mobile {
  width: 12.857%;
  text-align: center;
  font-size: 0.875rem;
  padding: 1.5rem 0.5rem; /* Increase padding significantly */
}

.meal-cell-mobile {
  width: 12.857%;
  padding: 1rem 0.5rem; /* Increase padding significantly for more space */
  text-align: center;
}

.meal-slot-mobile {
  min-height: 90px; /* Increase height significantly for more space */
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  border-radius: 6px;
  padding: 1rem; /* Increase padding significantly */
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 107, 26, 0.1);
  font-size: 0.75rem;
  margin: 0.5rem 0; /* Add more vertical margin */
}

.meal-content-mobile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
}

.meal-image-mobile {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid rgba(255, 107, 26, 0.2);
}

.meal-title-mobile {
  font-weight: 500;
  color: #1a1a1a;
  word-break: break-word;
  font-size: 0.7rem;
  line-height: 1.1;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plus-sign-mobile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 107, 26, 0.1);
  color: #ff6b1a;
  font-size: 1.2rem;
  font-weight: 300;
  transition: all 0.3s;
}

.delete-meal-btn-mobile {
  position: absolute;
  top: 2px;
  right: 2px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.125rem;
  color: #dc2626;
  opacity: 0.8;
  transition: opacity 0.2s ease, transform 0.15s ease;
}

.delete-meal-btn-mobile:hover {
  opacity: 1;
  transform: scale(1.2);
}

.meal-slot-mobile.empty {
  min-height: 80px; /* Increase empty slot height significantly */
}

.meal-slot-mobile:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(255, 107, 26, 0.15);
  background: rgba(255, 255, 255, 0.8);
}

.meal-slot-mobile:hover .plus-sign-mobile {
  background: #ff6b1a;
  color: white;
  transform: scale(1.05);
}

/* Single Day View Styles (matching large screen styles) */
.single-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 2px solid rgba(255, 107, 26, 0.1);
}

.nav-arrow {
  background: #ff9800;
  border: 2px solid #ff9800;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.3s;
  flex-shrink: 0;
}

.nav-arrow:hover:not(:disabled) {
  background: #ff6b1a;
  color: white;
  transform: scale(1.1);
}

.nav-arrow:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-day-info {
  text-align: center;
  flex: 1;
}

.day-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #6b46c1;
}

.day-date {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

.meal-slot-single {
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

.meal-slot-single.empty {
  background: rgba(255, 255, 255, 0.4);
  min-height: 60px;
}

.meal-slot-single:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 26, 0.2);
  background: rgba(255, 255, 255, 0.9);
}

.meal-slot-single.highlight {
  outline: 3px solid #ffcc00;
  background: #fff8e6;
  animation: pulse 1s ease-in-out;
}

.meal-content-single {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  position: relative;
}

.meal-image-single {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(255, 107, 26, 0.2);
}

.meal-title-single {
  font-weight: 600;
  color: #1a1a1a;
  word-break: break-word;
  font-size: 0.875rem;
  line-height: 1.2;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plus-sign-single {
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

.meal-slot-single:hover .plus-sign-single {
  background: #ff6b1a;
  color: white;
  transform: scale(1.1);
}

.delete-meal-btn-single {
  position: absolute;
  top: 6px;
  right: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.25rem;
  color: #dc2626;
  opacity: 0.8;
  transition: opacity 0.2s ease, transform 0.15s ease;
}

.delete-meal-btn-single:hover {
  opacity: 1;
  transform: scale(1.2);
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

  .meal-slot.empty {
    min-height: 45px;
  }

  .meal-title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .week-nav {
    flex-direction: row;
  }

  .current-week {
    font-size: 0.875rem;
  }
}

@media (max-width: 768px) {
  .card-header-custom {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .week-nav {
    flex-direction: row;
    justify-content: center;
    gap: 0.5rem;
  }

  .meal-planner-table th,
  .meal-planner-table td {
    padding: 0.5rem;
    font-size: 0.875rem;
  }

  /* Switch to mobile table layout */
  .desktop-table {
    display: none;
  }

  .mobile-table {
    display: table;
  }

  .meal-content-mobile {
    position: static;
  }

  .meal-image-mobile {
    order: 1;
  }

  .meal-title-mobile {
    order: 2;
  }

  .delete-meal-btn-mobile {
    position: static;
    order: 3;
    margin-top: 0.125rem;
    align-self: center;
  }
}

</style>
