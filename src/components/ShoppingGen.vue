<template>
  <div class="shopping-gen-container">
    <!-- Generate Button -->
    <div class="text-center mt-4">
      <button @click="openModal" class="btn btn-orange px-4 py-2">
        <i class="bi bi-cart-plus me-2"></i>Generate Shopping List
      </button>
    </div>

    <!-- Shopping List Modal -->
    <transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <!-- Close Button -->
          <button @click="closeModal" class="btn-close-modal">
            <i class="bi bi-x-lg"></i>
          </button>

          <!-- Header -->
          <div class="modal-header">
            <h3><i class="bi bi-cart-plus me-2" style="color: #ff6b1a;"></i>Generate Shopping List</h3>
            <p class="text-muted">Select your date range to build your shopping list</p>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <!-- Progress Overlay -->
            <transition name="fade">
              <div v-if="isProcessing" class="processing-overlay">
                <div class="spinner"></div>
                <p class="mt-2">{{ processingMessage }}</p>
              </div>
            </transition>

            <!-- Date Range Selection -->
            <div class="date-range-selector mb-4">
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
                    :current-week="calendarCurrentWeek"
                    :selected-dates="selectedDateRange"
                    :mode="'range'"
                    class="large-calendar"
                    :auto-close="false"
                    @select-date="handleCalendarDateSelect"
                  />
                </div>
              </div>
            </div>

            <!-- Selected Range -->
            <div class="selected-range mt-3">
              <i class="bi bi-calendar-range me-2"></i>
              <strong>{{ formattedDateRange }}</strong>
            </div>

            <!-- Reset -->
            <div class="mt-3 text-center" v-if="startDate">
              <button @click="resetDateSelection" class="btn btn-outline-secondary btn-sm">
                <i class="bi bi-arrow-counterclockwise me-1"></i>Reset Selection
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button @click="closeModal" class="btn btn-secondary">Cancel</button>
            <button
              @click="confirmGenerateShoppingList"
              class="btn btn-orange ms-2"
              :disabled="!shoppingStartDate || !shoppingEndDate || isProcessing"
            >
              <i class="bi bi-check-circle me-1"></i>Generate
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Toast Notification -->
    <transition name="slide-up">
      <div v-if="showToast" class="toast" :class="toastType">
        <i
          :class="toastType === 'error' ? 'bi bi-exclamation-circle-fill' : 'bi bi-check-circle-fill'"
          class="me-2"
        ></i>
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, getCurrentUser } from '@/lib/supabase'
import MiniCalendar from '@/components/MiniCalendar.vue'
import { IngredientCategorizer } from '@/utils/IngredientsCategorizer.js'
import { groupAndNormalizeIngredients } from '@/utils/IngredientsNormalisation.js'
import Swal from 'sweetalert2'

const router = useRouter()
const currentUser = ref(null)

onMounted(async () => {
  currentUser.value = await getCurrentUser()
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('click', handleDatePickerClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('click', handleDatePickerClickOutside)
})

// Props
const props = defineProps({ 
  currentWeek: { 
    type: Date, 
    default: () => new Date() 
  } 
})

// State
const showModal = ref(false)
const startDate = ref(null)
const endDate = ref(null)
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)
const startDateRef = ref(null)
const endDateRef = ref(null)
const selectionMode = ref('endDate') // 'endDate' or 'duration'
const durationValue = ref(1)
const durationUnit = ref('weeks') // 'days', 'weeks', 'months'
const isProcessing = ref(false)
const processingMessage = ref('')
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Computed
const startDateDisplay = computed(() => {
  if (!startDate.value) return ''
  return startDate.value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
})

const endDateDisplay = computed(() => {
  if (!endDate.value) return ''
  return endDate.value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
})

const selectedDateRange = computed(() => {
  const dates = []
  if (startDate.value) dates.push(formatDateLocal(startDate.value))

  const effectiveEndDate = selectionMode.value === 'duration' ? endDateFromDuration.value : endDate.value
  if (effectiveEndDate) dates.push(formatDateLocal(effectiveEndDate))

  return dates
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

const formattedDateRange = computed(() => {
  if (!startDate.value) return 'Select start date'
  const effectiveEndDate = selectionMode.value === 'duration' ? endDateFromDuration.value : endDate.value
  if (!effectiveEndDate) return `${startDateDisplay.value} - Select end date`
  return `${startDateDisplay.value} - ${effectiveEndDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`
})

const calendarCurrentWeek = computed(() => {
  const effectiveEndDate = selectionMode.value === 'duration' ? endDateFromDuration.value : endDate.value
  return effectiveEndDate || startDate.value || new Date()
})

const shoppingStartDate = computed(() => startDate.value)

const shoppingEndDate = computed(() => {
  return selectionMode.value === 'duration' ? endDateFromDuration.value : endDate.value
})

// Helpers
const formatDate = dateStr => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateLocal = d => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const displayAlert = async (msg, type = 'success', title = null) => {
  const config = {
    text: msg,
    confirmButtonColor: '#6b46c1'
  }

  if (type === 'success') {
    config.icon = 'success'
    config.title = title || 'Success!'
  } else if (type === 'error') {
    config.icon = 'error'
    config.title = title || 'Error!'
  } else if (type === 'info') {
    config.icon = 'info'
    config.title = title || 'Information'
  } else if (type === 'warning') {
    config.icon = 'warning'
    config.title = title || 'Warning!'
  }

  await Swal.fire(config)
}

// Click outside handler
function handleClickOutside(event) {
  if (showStartDatePicker.value && startDateRef.value && !startDateRef.value.contains(event.target)) {
    showStartDatePicker.value = false
  }
  if (showEndDatePicker.value && endDateRef.value && !endDateRef.value.contains(event.target)) {
    showEndDatePicker.value = false
  }
}

// UI handlers
function openModal() {
  showModal.value = true
  resetDateSelection()
}

function closeModal() {
  showModal.value = false
  resetDateSelection()
}

function toggleStartDatePicker() {
  showStartDatePicker.value = !showStartDatePicker.value
  showEndDatePicker.value = false
}

function toggleEndDatePicker() {
  showEndDatePicker.value = !showEndDatePicker.value
  showStartDatePicker.value = false
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

function resetDateSelection() {
  startDate.value = null
  endDate.value = null
  selectionMode.value = 'endDate'
  durationValue.value = 1
  durationUnit.value = 'weeks'
  showStartDatePicker.value = false
  showEndDatePicker.value = false
}

// Main Function
async function confirmGenerateShoppingList() {
  const effectiveEndDate = selectionMode.value === 'duration' ? endDateFromDuration.value : endDate.value

  if (!startDate.value || !effectiveEndDate) {
    await displayAlert('Please select both start and end dates', 'error', 'Missing Dates')
    return
  }

  const start = new Date(startDate.value)
  const end = new Date(effectiveEndDate)
  const days = Math.ceil((end - start) / 86400000) + 1

  if (days < 0) {
    await displayAlert('End date must be after start date', 'error', 'Invalid Date Range')
    return
  }
  if (days > 30) {
    await displayAlert('Date range too large (max 30 days)', 'error', 'Range Too Large')
    return
  }

  isProcessing.value = true
  processingMessage.value = 'Fetching meal plans...'

  try {
    // Fetch meal plans within date range
    const { data: plans, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .gte('date', formatDateLocal(startDate.value))
      .lte('date', formatDateLocal(effectiveEndDate))

    if (error) throw error

    if (!plans || plans.length === 0) {
      await displayAlert('No meals found in selected range', 'info', 'No Meals Found')
      isProcessing.value = false
      return
    }

    // Extract ingredients from meals
    processingMessage.value = 'Extracting ingredients...'
    const ingredients = []
    
    plans.forEach(plan => {
      if (Array.isArray(plan.extendedIngredients) && plan.extendedIngredients.length > 0) {
        plan.extendedIngredients.forEach(ing => {
          const amount = parseFloat(ing.amount)
          const validAmount = !isNaN(amount) && amount > 0 ? amount : 1
          
          ingredients.push({
            name: ing.name || ing.originalName || 'Unknown Ingredient',
            amount: validAmount,
            unit: ing.unit || ing.measures?.metric?.unitShort || 'piece'
          })
        })
      }
    })

    if (ingredients.length === 0) {
      await displayAlert('No ingredients found in meal plans', 'info', 'No Ingredients')
      isProcessing.value = false
      return
    }

    // Normalize and categorize ingredients
    processingMessage.value = 'Normalizing ingredients...'
    let grouped = groupAndNormalizeIngredients(ingredients)
    grouped = IngredientCategorizer.categorizeIngredients(grouped)

    // Fetch existing shopping items
    processingMessage.value = 'Checking existing shopping list...'
    const { data: existing, error: existingError } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .eq('purchased', false)

    if (existingError) throw existingError

    const insert = []
    const update = []

    // Compare and merge with existing items
    grouped.forEach(newItem => {
      const newAmount = Number(newItem.amount) || 1
      const roundedAmount = Math.max(1, Math.round(newAmount))

      const match = existing?.find(
        i =>
          i.name.toLowerCase().trim() === newItem.name.toLowerCase().trim() &&
          i.unit === newItem.unit
      )

      if (match) {
        const existingQty = Number(match.quantity) || 0
        const newQty = Math.max(1, Math.round(existingQty + newAmount))
        
        update.push({
          id: match.id,
          user_id: currentUser.value.id,
          name: match.name,
          unit: match.unit,
          quantity: newQty,
          category: newItem.category || match.category || 'Other',
          purchased: false
        })
      } else {
        insert.push({
          user_id: currentUser.value.id,
          name: newItem.name.trim(),
          quantity: roundedAmount,
          unit: newItem.unit || '',
          category: newItem.category || 'Other',
          purchased: false
        })
      }
    })

    // Perform updates and inserts
    processingMessage.value = 'Saving shopping list...'

    if (update.length > 0) {
      const { error: updateError } = await supabase
        .from('shopping_items')
        .upsert(update, { onConflict: 'id' })
      
      if (updateError) throw updateError
    }

    if (insert.length > 0) {
      const { error: insertError } = await supabase
        .from('shopping_items')
        .insert(insert)
      
      if (insertError) throw insertError
    }

    // Success
    await Swal.fire({
      icon: 'success',
      title: 'Shopping List Generated!',
      text: `${insert.length} new items added, ${update.length} items updated`,
      confirmButtonColor: '#6b46c1',
      timer: 4000,
      timerProgressBar: true
    })
    
    showModal.value = false
    setTimeout(() => {
      router.push('/shopping')
    }, 500)

  } catch (err) {
    console.error('Error generating shopping list:', err)
    await displayAlert(err.message || 'Unknown error occurred', 'error', 'Generation Failed')
  } finally {
    isProcessing.value = false
    processingMessage.value = ''
  }
}
</script>

<style scoped>
/* --- General --- */
.shopping-gen-container { position: relative; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* --- Button Styles --- */
.btn-orange {
  background: linear-gradient(135deg, #ff6b1a 0%, #ff9800 100%);
  border: none;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 107, 26, 0.3);
}

.btn-orange:hover {
  background: linear-gradient(135deg, #e55a00 0%, #e68900 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 107, 26, 0.4);
}

.btn-orange:disabled {
  background: #ccc;
  transform: none;
  box-shadow: none;
  cursor: not-allowed;
}

/* --- Modal --- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 1000;
  padding: 5rem 1rem 1rem;
  overflow-y: auto;
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  max-width: 640px;
  width: 100%;
  max-height: calc(90vh - 2rem);
  box-shadow: 0 6px 30px rgba(0,0,0,0.2);
  animation: slide-up 0.35s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow-y: auto;
}

@keyframes slide-up {
  from { transform: translateY(40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 107, 26, 0.1);
}

.modal-header h3 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.modal-body { 
  padding: 1.5rem 2rem; 
  position: relative; 
  overflow: visible;
}

.modal-footer {
  padding: 1rem 2rem 1.5rem;
  border-top: 1px solid rgba(255, 107, 26, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-close-modal {
  position: absolute; 
  top: 1rem; 
  right: 1rem;
  background: white; 
  border: none; 
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  width: 36px; 
  height: 36px; 
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.btn-close-modal:hover { 
  background: #f3f3f3; 
}

/* --- Processing Overlay --- */
.processing-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 8px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff6b1a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* --- Steps --- */
.step-tracker {
  display: flex; 
  justify-content: space-around; 
  align-items: center;
  position: relative; 
  margin-bottom: 2rem;
}

.step-tracker::before {
  content: ''; 
  position: absolute; 
  top: 16px; 
  left: 20%;
  right: 20%; 
  height: 2px; 
  background: #ddd; 
  z-index: 0;
}

.step {
  text-align: center; 
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.step .circle {
  width: 32px; 
  height: 32px;
  border-radius: 50%; 
  background: #e0e0e0;
  color: #555; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-weight: 600;
  transition: all 0.3s;
}

.step.active .circle {
  background: #ff6b1a; 
  color: #fff;
  box-shadow: 0 0 0 3px rgba(255, 107, 26, 0.2);
  transform: scale(1.1);
}

.step span {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

.step.active span {
  color: #ff6b1a;
  font-weight: 600;
}

/* --- Date Range Selector --- */
.date-range-selector {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.date-selection-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1a1a;
}

.date-input-wrapper {
  position: relative;
}

.date-input {
  width: 100%;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  cursor: pointer;
  background: white;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1a1a;
  transition: all 0.2s;
}

.date-input:focus {
  outline: none;
  border-color: #ff6b1a;
  box-shadow: 0 0 0 3px rgba(255, 107, 26, 0.1);
}

.date-input:disabled {
  background: #f7f7f7;
  cursor: not-allowed;
  color: #999;
}

.date-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  pointer-events: none;
}

.selection-mode {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  color: #1a1a1a;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  margin: 0;
  accent-color: #ff6b1a;
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
  flex: 1;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1a1a;
  transition: all 0.2s;
}

.duration-number:focus {
  outline: none;
  border-color: #ff6b1a;
  box-shadow: 0 0 0 3px rgba(255, 107, 26, 0.1);
}

.duration-unit {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1a1a;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.duration-unit:focus {
  outline: none;
  border-color: #ff6b1a;
  box-shadow: 0 0 0 3px rgba(255, 107, 26, 0.1);
}

.calendar-right {
  flex-shrink: 0;
}

.calendar-container {
  width: 280px;
  height: 290px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.large-calendar {
  width: 100%;
  height: 100%;
}

/* --- Selected Range --- */
.selected-range {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 107, 26, 0.05);
  border-radius: 8px;
  color: #ff6b1a;
  font-size: 0.875rem;
}

/* --- Small Calendar --- */
.small-calendar :deep(.mini-calendar) {
  width: 220px !important;
  padding: 0.5rem !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
  background: white !important;
}

.small-calendar :deep(.calendar-dropdown) {
  border: none !important;
  box-shadow: none !important;
}

.small-calendar :deep(.dropdown-content) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

.small-calendar :deep(.mini-calendar-days) {
  grid-template-columns: repeat(7, 1fr) !important;
}

.small-calendar :deep(.mini-calendar-day) {
  width: 20px !important;
  height: 20px !important;
  font-size: 0.7rem !important;
}

/* --- Toast --- */
.toast {
  position: fixed; 
  bottom: 2rem; 
  right: 2rem;
  color: white; 
  padding: 1rem 1.5rem;
  border-radius: 12px; 
  display: flex; 
  align-items: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  animation: slideInUp 0.3s ease;
  z-index: 9999;
}

.toast.success { 
  background: linear-gradient(135deg, #10b981, #34d399); 
}

.toast.error { 
  background: linear-gradient(135deg, #dc2626, #f87171); 
}

.slide-up-enter-active, .slide-up-leave-active { 
  transition: all 0.3s; 
}

.slide-up-enter-from, .slide-up-leave-to { 
  transform: translateY(30px); 
  opacity: 0; 
}

@keyframes slideInUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* --- Responsive --- */
@media (max-width: 992px) {
  .date-range-selector {
    flex-direction: column;
    gap: 1rem;
  }

  .calendar-container {
    width: 280px;
    height: 290px;
    margin: 0 auto;
  }

  .date-selection-left {
    width: 100%;
  }

  .date-input-group {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .mode-toggle {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .duration-inputs {
    flex-direction: column;
    gap: 0.5rem;
  }

  .step span {
    font-size: 0.75rem;
  }
}
</style>