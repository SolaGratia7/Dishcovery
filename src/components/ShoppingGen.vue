<template>
  <div class="shopping-gen-container">
    <!-- Generate Button -->
    <div class="text-center mt-4">
      <button @click="openModal" class="btn btn-success px-4 py-2">
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
            <h3><i class="bi bi-cart-plus me-2 text-success"></i>Generate Shopping List</h3>
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
              class="btn btn-success ms-2"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, getCurrentUser } from '@/lib/supabase'
import MiniCalendar from '@/components/MiniCalendar.vue'
import { IngredientCategorizer } from '@/utils/IngredientsCategorizer.js'
import { groupAndNormalizeIngredients } from '@/utils/IngredientsNormalisation.js'

const router = useRouter()
const currentUser = ref(null)

onMounted(async () => {
  currentUser.value = await getCurrentUser()
})

//props
const props = defineProps({ currentWeek: { type: Date, default: () => new Date() } })

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
const formatDate = dateStr => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const formatDateLocal = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const displayToast = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => (showToast.value = false), 3000)
}

// UI handlers
function openModal() { showModal.value = true }
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
  setTimeout(() => (showEndCalendar.value = true), 200)
}
function onEndDateSelected(date) {
  const dateStr = formatDateLocal(date)
  if (dateStr < shoppingStartDate.value) {
    [shoppingStartDate.value, shoppingEndDate.value] = [dateStr, shoppingStartDate.value]
  } else shoppingEndDate.value = dateStr
  showEndCalendar.value = false
}
function resetDateSelection() {
  shoppingStartDate.value = ''
  shoppingEndDate.value = ''
  dateSelectionStep.value = 'start'
  showStartCalendar.value = false
  showEndCalendar.value = false
}

// Main Function (same logic but cleaned)
// Main Function
async function confirmGenerateShoppingList() {
  if (!shoppingStartDate.value || !shoppingEndDate.value) {
    displayToast('Please select both start and end dates', 'error');
    return;
  }

  const start = new Date(shoppingStartDate.value);
  const end = new Date(shoppingEndDate.value);
  const days = (end - start) / 86400000;

  if (days < 0) {
    displayToast('End date must be after start date', 'error');
    return;
  }
  if (days > 30) {
    displayToast('Date range too large (max 30 days)', 'error');
    return;
  }

  isProcessing.value = true;
  processingMessage.value = 'Fetching meal plans...';

  try {
    // --- Fetch meal plans within date range ---
    const { data: plans, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .gte('date', shoppingStartDate.value)
      .lte('date', shoppingEndDate.value);

    if (error) throw error;
    if (!plans?.length) {
      displayToast('No meals found in selected range', 'error');
      return;
    }

    // --- Extract ingredients from meals ---
    processingMessage.value = 'Extracting ingredients...';
    let ingredients = [];
    plans.forEach(plan => {
      if (Array.isArray(plan.extendedIngredients)) {
        plan.extendedIngredients.forEach(ing => {
          ingredients.push({
            name: ing.name || 'Unknown',
            amount: parseFloat(ing.amount) || 1,
            unit: ing.unit || 'piece'
          });
        });
      }
    });

    if (!ingredients.length) {
      displayToast('No ingredients found', 'error');
      return;
    }

    // --- Normalize and categorize ingredients ---
    processingMessage.value = 'Normalizing ingredients...';
    let grouped = groupAndNormalizeIngredients(ingredients);
    grouped = IngredientCategorizer.categorizeIngredients(grouped);

    // --- Fetch existing shopping items ---
    processingMessage.value = 'Checking existing shopping list...';
    const { data: existing, error: existingError } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .eq('purchased', false);

    if (existingError) throw existingError;

    const insert = [];
    const update = [];

    // --- Compare and merge with existing items ---
    grouped.forEach(newItem => {
      const match = existing?.find(
        i =>
          i.name.toLowerCase() === newItem.name.toLowerCase() &&
          i.unit === newItem.unit
      );

      if (match) {
        // Update existing quantity
        update.push({
          id: match.id,
          quantity: Math.round(parseFloat(match.quantity) + parseFloat(newItem.amount)),
          category: newItem.category
        });
      } else {
        // Prepare new item for insert
        insert.push({
          user_id: currentUser.value.id,
          name: newItem.name,
          quantity: Math.round(parseFloat(newItem.amount)), // ensure integer
          unit: newItem.unit || '',
          category: newItem.category || 'Other',
          purchased: false
        });
      }
    });

    // --- Perform updates and inserts ---
    processingMessage.value = 'Saving shopping list...';

    if (update.length > 0) {
      const { error: updateError } = await supabase
        .from('shopping_items')
        .upsert(update, { onConflict: 'id' });
      if (updateError) throw updateError;
    }

    if (insert.length > 0) {
      const { error: insertError } = await supabase
        .from('shopping_items')
        .insert(insert);
      if (insertError) throw insertError;
    }

    // --- Success ---
    displayToast(
      `Shopping list updated successfully! (${insert.length} new, ${update.length} updated)`,
      'success'
    );
    router.push('/shopping');
  } catch (err) {
    console.error('Error generating shopping list:', err);
    displayToast(`Error: ${err.message}`, 'error');
  } finally {
    isProcessing.value = false;
    showModal.value = false;
  }
}

</script>

<style scoped>
/* --- General --- */
.shopping-gen-container { position: relative; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* --- Modal --- */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 640px;
  width: 100%;
  box-shadow: 0 6px 30px rgba(0,0,0,0.2);
  animation: slide-up 0.35s ease;
  display: flex; flex-direction: column;
}
@keyframes slide-up {
  from { transform: translateY(40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.modal-header, .modal-footer {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #eee;
}
.modal-body { padding: 1.5rem 2rem; position: relative; }
.btn-close-modal {
  position: absolute; top: 1rem; right: 1rem;
  background: white; border: none; border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  width: 36px; height: 36px; cursor: pointer;
}
.btn-close-modal:hover { background: #f3f3f3; }
.modal-body-custom {
  overflow: visible !important;
  position: relative;
}
.modal-content-custom.modal-large {
  max-height: 90vh;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.date-input-wrapper {
  position: relative;
  overflow: visible !important;
  z-index: 999;
}
@media (max-height: 700px) {
  .modal-content-custom.modal-large {
    max-height: 80vh;
    overflow-y: auto;
  }
}

/* --- Steps --- */
.step-tracker {
  display: flex; justify-content: space-around; align-items: center;
  position: relative; margin-bottom: 1rem;
}
.step-tracker::before {
  content: ''; position: absolute; top: 16px; left: 10%;
  right: 10%; height: 2px; background: #ddd; z-index: 0;
}
.step {
  text-align: center; z-index: 1;
}
.step .circle {
  width: 32px; height: 32px;
  border-radius: 50%; background: #e0e0e0;
  color: #555; display: flex; align-items: center; justify-content: center;
  font-weight: 600; margin: 0 auto 6px;
}
.step.active .circle {
  background: #10b981; color: #fff;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.2);
}

/* --- Date Inputs --- */
.date-inputs {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
}
.date-wrapper { position: relative; }
.date-wrapper input {
  width: 100%; border: 1px solid #ddd; border-radius: 8px;
  padding: 0.6rem 2.5rem 0.6rem 1rem; cursor: pointer;
}
.date-wrapper input:disabled { background: #f7f7f7; cursor: not-allowed; }
.calendar-icon {
  position: absolute; right: 0.75rem; top: 50%;
  transform: translateY(-50%); color: #10b981;
}

/* --- Toast --- */
.toast {
  position: fixed; bottom: 2rem; right: 2rem;
  color: white; padding: 1rem 1.5rem;
  border-radius: 10px; display: flex; align-items: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
.toast.success { background: linear-gradient(135deg, #16a34a, #22c55e); }
.toast.error { background: linear-gradient(135deg, #dc2626, #ef4444); }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(30px); opacity: 0; }
</style>
