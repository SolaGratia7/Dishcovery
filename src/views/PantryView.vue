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

            <!-- Step Indicator -->
            <div class="step-tracker mb-4">
              <div
                v-for="(step, index) in steps"
                :key="index"
                class="step"
                :class="{ active: dateSelectionStep === step.key }"
              >
                <div class="circle">{{ index + 1 }}</div>
                <span>{{ step.label }}</span>
              </div>
            </div>

            <!-- Date Inputs -->
            <div class="date-inputs">
              <div class="input-group">
                <label>Start Date</label>
                <div class="date-wrapper" ref="startDateRef">
                  <input
                    type="text"
                    readonly
                    :value="shoppingStartDate ? formatDate(shoppingStartDate) : ''"
                    placeholder="Select start date"
                    @click="toggleStartCalendar"
                  />
                  <i class="bi bi-calendar3 calendar-icon"></i>
                  <MiniCalendar
                    v-if="showStartCalendar"
                    :current-week="currentWeek"
                    :selected-dates="selectedDatesForShopping"
                    mode="range"
                    dropdown-position="below"
                    class="small-calendar"
                    @select-date="onStartDateSelected"
                  />
                </div>
              </div>

              <div class="input-group">
                <label>End Date</label>
                <div class="date-wrapper" ref="endDateRef">
                  <input
                    type="text"
                    readonly
                    :disabled="!shoppingStartDate"
                    :value="shoppingEndDate ? formatDate(shoppingEndDate) : ''"
                    placeholder="Select end date"
                    @click="toggleEndCalendar"
                  />
                  <i class="bi bi-calendar3 calendar-icon"></i>
                  <MiniCalendar
                    v-if="showEndCalendar"
                    :current-week="currentWeek"
                    :selected-dates="selectedDatesForShopping"
                    mode="range"
                    dropdown-position="below"
                    class="small-calendar"
                    @select-date="onEndDateSelected"
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
            <div class="mt-3 text-center" v-if="shoppingStartDate">
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
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
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
const shoppingStartDate = ref('')
const shoppingEndDate = ref('')
const dateSelectionStep = ref('start')
const showStartCalendar = ref(false)
const showEndCalendar = ref(false)
const isProcessing = ref(false)
const processingMessage = ref('')
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const startDateRef = ref(null)
const endDateRef = ref(null)

// Step tracker
const steps = [
  { key: 'start', label: 'Select Start Date' },
  { key: 'end', label: 'Select End Date' }
]

// Computed
const selectedDatesForShopping = computed(() => {
  const dates = []
  if (shoppingStartDate.value) dates.push(shoppingStartDate.value)
  if (shoppingEndDate.value) dates.push(shoppingEndDate.value)
  return dates
})

const formattedDateRange = computed(() => {
  if (!shoppingStartDate.value) return 'Select start date'
  if (!shoppingEndDate.value) return `${formatDate(shoppingStartDate.value)} - Select end date`
  return `${formatDate(shoppingStartDate.value)} - ${formatDate(shoppingEndDate.value)}`
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
  if (showStartCalendar.value && startDateRef.value && !startDateRef.value.contains(event.target)) {
    showStartCalendar.value = false
  }
  if (showEndCalendar.value && endDateRef.value && !endDateRef.value.contains(event.target)) {
    showEndCalendar.value = false
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

function toggleStartCalendar() {
  showStartCalendar.value = !showStartCalendar.value
  showEndCalendar.value = false
}

function toggleEndCalendar() {
  if (!shoppingStartDate.value) return
  showEndCalendar.value = !showEndCalendar.value
  showStartCalendar.value = false
}

function onStartDateSelected(date) {
  shoppingStartDate.value = formatDateLocal(date)
  shoppingEndDate.value = ''
  dateSelectionStep.value = 'end'
  showStartCalendar.value = false
  setTimeout(() => {
    showEndCalendar.value = true
  }, 200)
}

function onEndDateSelected(date) {
  const dateStr = formatDateLocal(date)
  if (dateStr < shoppingStartDate.value) {
    const temp = shoppingStartDate.value
    shoppingStartDate.value = dateStr
    shoppingEndDate.value = temp
  } else {
    shoppingEndDate.value = dateStr
  }
  showEndCalendar.value = false
}

function resetDateSelection() {
  shoppingStartDate.value = ''
  shoppingEndDate.value = ''
  dateSelectionStep.value = 'start'
  showStartCalendar.value = false
  showEndCalendar.value = false
}

// Main Function
async function confirmGenerateShoppingList() {
  if (!shoppingStartDate.value || !shoppingEndDate.value) {
    await displayAlert('Please select both start and end dates', 'error', 'Missing Dates')
    return
  }

  const start = new Date(shoppingStartDate.value)
  const end = new Date(shoppingEndDate.value)
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
      .gte('date', shoppingStartDate.value)
      .lte('date', shoppingEndDate.value)

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
      timer: 2000,
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
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  max-width: 640px;
  width: 100%;
  box-shadow: 0 6px 30px rgba(0,0,0,0.2);
  animation: slide-up 0.35s ease;
  display: flex; 
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
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

/* --- Date Inputs --- */
.date-inputs {
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  gap: 1rem;
  margin-bottom: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1a1a;
}

.date-wrapper { 
  position: relative; 
}

.date-wrapper input {
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

.date-wrapper input:focus {
  outline: none; 
  border-color: #ff6b1a; 
  box-shadow: 0 0 0 3px rgba(255, 107, 26, 0.1);
}

.date-wrapper input:disabled { 
  background: #f7f7f7; 
  cursor: not-allowed;
  color: #999;
}

.calendar-icon {
  position: absolute; 
  right: 0.75rem; 
  top: 50%;
  transform: translateY(-50%); 
  color: #666;
  pointer-events: none;
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
@media (max-width: 640px) {
  .date-inputs {
    grid-template-columns: 1fr;
  }
  
  .step span {
    font-size: 0.75rem;
  }
}
</style>