<template>
  <div class="shopping-gen-container">
    <!-- Generate Button -->
    <div class="mt-4">
      <button @click="generateShoppingList" class="btn btn-success">
        <i class="bi bi-cart-plus me-2"></i>
        Generate Shopping List
      </button>
    </div>

    <!-- Shopping List Generation Modal -->
    <div v-if="showShoppingListModal" class="modal-overlay" @click="closeShoppingListModal">
      <div class="modal-content-custom modal-large" @click.stop>
        <button @click="closeShoppingListModal" class="btn-close-modal">
          <i class="bi bi-x-lg"></i>
        </button>
        
        <div class="modal-header-custom">
          <h3><i class="bi bi-cart-plus me-2"></i>Generate Shopping List</h3>
          <p class="text-muted">Select date range for your shopping list</p>
        </div>
        
        <div class="modal-body-custom">
          <!-- Progress Indicator -->
          <div v-if="isProcessing" class="processing-overlay">
            <div class="spinner"></div>
            <p>{{ processingMessage }}</p>
          </div>

          <!-- Date Selection Instructions -->
          <div class="date-selection-info mb-3">
            <div class="info-card">
              <div class="step-indicator">
                <span :class="['step-badge', { 'active': dateSelectionStep === 'start' }]">1</span>
                <span class="step-text">Select Start Date</span>
              </div>
              <div class="step-indicator">
                <span :class="['step-badge', { 'active': dateSelectionStep === 'end' }]">2</span>
                <span class="step-text">Select End Date</span>
              </div>
            </div>
          </div>

          <!-- Date Range Selector -->
          <div class="date-range-selector">
            <div class="date-input-group">
              <label>Start Date</label>
              <div class="date-input-wrapper" ref="startDateRef">
                <input 
                  type="text" 
                  class="form-control date-input"
                  :value="shoppingStartDate ? formatDate(shoppingStartDate) : ''"
                  placeholder="Select start date"
                  readonly
                  @click="toggleStartCalendar"
                >
                <i class="bi bi-calendar3 calendar-icon"></i>
                
                <!-- Start Date Calendar Dropdown -->
                <MiniCalendar 
                  v-if="showStartCalendar"
                  :current-week="currentWeek"
                  :selected-dates="selectedDatesForShopping"
                  :mode="'range'"
                  @select-date="onStartDateSelected"
                />
              </div>
            </div>

            <div class="date-input-group">
              <label>End Date</label>
              <div class="date-input-wrapper" ref="endDateRef">
                <input 
                  type="text" 
                  class="form-control date-input"
                  :value="shoppingEndDate ? formatDate(shoppingEndDate) : ''"
                  placeholder="Select end date"
                  readonly
                  @click="toggleEndCalendar"
                  :disabled="!shoppingStartDate"
                >
                <i class="bi bi-calendar3 calendar-icon"></i>
                
                <!-- End Date Calendar Dropdown -->
                <MiniCalendar 
                  v-if="showEndCalendar"
                  :current-week="currentWeek"
                  :selected-dates="selectedDatesForShopping"
                  :mode="'range'"
                  @select-date="onEndDateSelected"
                />
              </div>
            </div>
          </div>

          <!-- Selected Range Display -->
          <div class="selected-range mt-3">
            <i class="bi bi-calendar-range me-2"></i>
            <strong>{{ formattedDateRange }}</strong>
          </div>

          <!-- Reset Button -->
          <div class="mt-3 text-center">
            <button 
              @click="resetDateSelection" 
              class="btn btn-outline-secondary btn-sm"
              v-if="shoppingStartDate"
            >
              <i class="bi bi-arrow-counterclockwise me-1"></i>
              Reset Selection
            </button>
          </div>
        </div>
        
        <div class="modal-footer-custom">
          <button @click="closeShoppingListModal" class="btn btn-secondary">
            Cancel
          </button>
          <button 
            @click="confirmGenerateShoppingList" 
            class="btn btn-success ms-2"
            :disabled="!shoppingStartDate || !shoppingEndDate || isProcessing"
          >
            <i class="bi bi-check-circle me-1"></i>
            Generate Shopping List
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="showToast" class="toast-notification" :class="toastType">
      <i :class="toastType === 'error' ? 'bi bi-exclamation-circle-fill' : 'bi bi-check-circle-fill'" class="me-2"></i>
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, getCurrentUser } from '@/lib/supabase'
import MiniCalendar from '@/components/MiniCalendar.vue'
import axios from 'axios'

const router = useRouter()
const currentUser = ref(null)

// Props
const props = defineProps({
  currentWeek: {
    type: Date,
    default: () => new Date()
  }
})

// Shopping List Generation State
const showShoppingListModal = ref(false)
const shoppingStartDate = ref('')
const shoppingEndDate = ref('')
const dateSelectionStep = ref('start')
const showStartCalendar = ref(false)
const showEndCalendar = ref(false)
const startDateRef = ref(null)
const endDateRef = ref(null)
const isProcessing = ref(false)
const processingMessage = ref('')

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// IMPORTANT: Move this to your .env file or backend
// For now, I'll show you how to set it up properly
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

// Or better: Use a backend endpoint
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '/api/categorize'

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

// Helper Functions
function formatDateLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function displayToast(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// Main Functions
function generateShoppingList() {
  showShoppingListModal.value = true
  shoppingStartDate.value = ''
  shoppingEndDate.value = ''
  dateSelectionStep.value = 'start'
}

function closeShoppingListModal() {
  showShoppingListModal.value = false
  shoppingStartDate.value = ''
  shoppingEndDate.value = ''
  dateSelectionStep.value = 'start'
  showStartCalendar.value = false
  showEndCalendar.value = false
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
  const dateStr = formatDateLocal(date)
  shoppingStartDate.value = dateStr
  shoppingEndDate.value = '' // Reset end date when changing start
  dateSelectionStep.value = 'end'
  showStartCalendar.value = false
  
  // Auto-open end date calendar
  setTimeout(() => {
    showEndCalendar.value = true
  }, 300)
}

function onEndDateSelected(date) {
  const dateStr = formatDateLocal(date)
  
  if (dateStr < shoppingStartDate.value) {
    // Swap if end is before start
    shoppingEndDate.value = shoppingStartDate.value
    shoppingStartDate.value = dateStr
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

function normalizeIngredientName(name) {
  let normalized = name.toLowerCase().trim()
  
  // Remove numbers and special characters at the start
  normalized = normalized.replace(/^[0-9.\s]+/, '')
  
  // Remove measurements
  normalized = normalized.replace(/\d+\.?\d*\s*(oz|lb|g|kg|ml|l|tsp|tbsp|cup|c)\s*\.?\s*x?\s*/gi, '')
  
  // Remove common descriptors
  const removeWords = [
    'fresh', 'dried', 'frozen', 'canned', 'organic', 'raw', 'cooked',
    'extra virgin', 'virgin', 'pure', 'quality',
    'chopped', 'diced', 'sliced', 'minced', 'crushed', 'grated', 'shredded',
    'whole', 'ground', 'crumbled',
    'large', 'small', 'medium', 'baby', 'jumbo',
    'red', 'green', 'yellow', 'white', 'black', 'brown', 'orange', 'purple',
    'unsalted', 'salted', 'sweetened', 'unsweetened',
    'low fat', 'fat free', 'full fat', 'skim', '2%',
    'packed', 'firmly', 'lightly', 'loosely',
    'to taste', 'or more', 'about', 'approximately',
    'boneless', 'skinless', 'bone-in',
    'optional', 'for serving', 'for garnish',
    'uncooked', 'pre-cooked'
  ]
  
  removeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    normalized = normalized.replace(regex, '')
  })
  
  // Remove parenthetical content
  normalized = normalized.replace(/\([^)]*\)/g, '')
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim()
  
  // Common ingredient consolidations
  const consolidations = {
    // Oils
    'olive oil': 'olive oil',
    'oil olive': 'olive oil',
    'olives oil': 'olive oil',
    'oil': 'vegetable oil',
    'vegetable oil': 'vegetable oil',
    'canola oil': 'vegetable oil',
    'cooking oil': 'vegetable oil',
    'peanut oil': 'vegetable oil',
    
    // Tomatoes
    'tomato': 'tomatoes',
    'tomatos': 'tomatoes',
    'tomatoe': 'tomatoes',
    'cherry tomato': 'tomatoes',
    'roma tomato': 'tomatoes',
    'plum tomato': 'tomatoes',
    'grape tomato': 'tomatoes',
    
    // Onions
    'onion': 'onions',
    'yellow onion': 'onions',
    'shallot': 'shallots',
    
    // Garlic
    'garlic': 'garlic',
    'garlic clove': 'garlic',
    'clove of garlic': 'garlic',
    'clove garlic': 'garlic',
    
    // Salt and Pepper
    'salt': 'salt',
    'sea salt': 'salt',
    'table salt': 'salt',
    'kosher salt': 'salt',
    'salt and pepper': 'salt',
    'pepper': 'pepper',
    'black pepper': 'pepper',
    'peppercorn': 'pepper',
    'ground pepper': 'pepper',
    
    // Dairy
    'butter': 'butter',
    'milk': 'milk',
    'cream': 'cream',
    'half and half': 'cream',
    'heavy cream': 'cream',
    'whipping cream': 'cream',
    
    // Cheese
    'cheese': 'cheese',
    'shredded cheese': 'cheese',
    'grated cheese': 'cheese',
    'cheddar': 'cheddar cheese',
    'mozzarella': 'mozzarella cheese',
    'parmesan': 'parmesan',
    'parmigiano': 'parmesan',
    'parmigiano reggiano': 'parmesan',
    
    // Meats
    'chicken breast': 'chicken breast',
    'chicken': 'chicken breast',
    'turkey': 'turkey',
    'bacon': 'bacon',
    'ham': 'ham',
    'deli ham': 'ham',
    'sausage': 'sausage',
    'sausage meat': 'sausage',
    'spicy sausage': 'sausage',
    'chorizo': 'chorizo',
    'chorizo sausage': 'chorizo',
    
    // Eggs
    'egg': 'eggs',
    
    // Flour
    'flour': 'flour',
    'all purpose flour': 'flour',
    'plain flour': 'flour',
    
    // Sugar
    'sugar': 'sugar',
    'granulated sugar': 'sugar',
    'caster sugar': 'sugar',
    
    // Bread
    'bread': 'bread',
    'multigrain bread': 'bread',
    'whole wheat bread': 'bread',
    'brioche': 'brioche',
    'croissant': 'croissant',
    
    // Pasta
    'pasta': 'pasta',
    'angel hair pasta': 'pasta',
    'bow tie pasta': 'pasta',
    'ditilini pasta': 'pasta',
    'pasta shells': 'pasta',
    'pkt angel hair pasta': 'pasta',
    
    // Stock/Broth
    'chicken broth': 'chicken broth',
    'chicken stock': 'chicken broth',
    'vegetable broth': 'vegetable broth',
    'vegetable stock': 'vegetable broth',
    'turkey stock': 'turkey stock',
    
    // Beans
    'beans': 'beans',
    'cannellini beans': 'cannellini beans',
    'kidney beans': 'kidney beans',
    'chickpeas': 'chickpeas',
    
    // Herbs
    'parsley': 'parsley',
    'flat parsley': 'parsley',
    'parsley leaves': 'parsley',
    'cilantro': 'cilantro',
    'sage': 'sage',
    'thyme': 'thyme',
    'marjoram': 'marjoram',
    
    // Spices
    'cinnamon': 'cinnamon',
    'cumin': 'cumin',
    'coriander': 'coriander',
    'paprika': 'paprika',
    'chili powder': 'chili powder',
    'chipotle powder': 'chipotle powder',
    
    // Vegetables
    'celery': 'celery',
    'celery stick': 'celery',
    'celery stalk': 'celery',
    'carrot': 'carrots',
    'kale': 'kale',
    'spinach': 'spinach',
    'collard greens': 'collard greens',
    'escarole': 'escarole',
    'lettuce': 'lettuce',
    'lettuce leaves': 'lettuce',
    'leek': 'leeks',
    'mushroom': 'mushrooms',
    
    // Other
    'honey': 'honey',
    'tbsp honey': 'honey',
    'vanilla': 'vanilla extract',
    'vanilla extract': 'vanilla extract',
    'lemon juice': 'lemon juice',
    'juice of lemon': 'lemon juice',
    'lemon zest': 'lemon zest',
    'oats': 'oats',
    'quaker oats': 'oats'
  }
  
  // Check for exact matches first
  if (consolidations[normalized]) {
    return consolidations[normalized]
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(consolidations)) {
    if (normalized.includes(key)) {
      return value
    }
  }
  
  return normalized
}

// Unit conversion mappings
const UNIT_CONVERSIONS = {
  volume: {
    'cup': 240, 'cups': 240, 'c': 240,
    'tablespoon': 15, 'tablespoons': 15, 'tbsp': 15, 'tbs': 15, 't': 15,
    'teaspoon': 5, 'teaspoons': 5, 'tsp': 5,
    'ml': 1, 'milliliter': 1, 'milliliters': 1,
    'liter': 1000, 'liters': 1000, 'l': 1000,
    'fluid ounce': 30, 'fluid ounces': 30, 'fl oz': 30,
    'gallon': 3785, 'gallons': 3785,
    'pint': 473, 'pints': 473,
    'quart': 946, 'quarts': 946
  },
  weight: {
    'g': 1, 'gr': 1, 'gram': 1, 'grams': 1,
    'kg': 1000, 'kilogram': 1000, 'kilograms': 1000,
    'oz': 28.35, 'ounce': 28.35, 'ounces': 28.35,
    'lb': 453.592, 'lbs': 453.592, 'pound': 453.592, 'pounds': 453.592
  }
}

function normalizeUnit(amount, unit) {
  if (!unit || unit.toLowerCase().includes('serving')) {
    return { amount: amount, unit: 'piece', type: 'count' }
  }
  
  const unitLower = unit.toLowerCase().trim()
  
  // Check volume units
  if (UNIT_CONVERSIONS.volume[unitLower]) {
    const mlAmount = amount * UNIT_CONVERSIONS.volume[unitLower]
    if (mlAmount >= 1000) {
      return { amount: mlAmount / 1000, unit: 'liter', type: 'volume' }
    }
    return { amount: mlAmount, unit: 'ml', type: 'volume' }
  }
  
  // Check weight units
  if (UNIT_CONVERSIONS.weight[unitLower]) {
    const gramAmount = amount * UNIT_CONVERSIONS.weight[unitLower]
    if (gramAmount >= 1000) {
      return { amount: gramAmount / 1000, unit: 'kg', type: 'weight' }
    }
    return { amount: gramAmount, unit: 'g', type: 'weight' }
  }
  
  // Count units
  const countUnits = ['piece', 'pieces', 'whole', 'head', 'heads', 'bunch', 'clove', 'cloves', 
                      'slice', 'slices', 'can', 'cans', 'bag', 'bags', 'box', 'boxes',
                      'stalk', 'stalks', 'stick', 'sticks', 'leaf', 'leaves', 'handful', 'handfuls',
                      'inch', 'inches']
  
  if (countUnits.some(u => unitLower.includes(u))) {
    return { amount: amount, unit: 'piece', type: 'count' }
  }
  
  return { amount: amount, unit: unit || 'piece', type: 'count' }
}

function getPreferredUnitType(ingredientName) {
  const name = ingredientName.toLowerCase()
  
  // Liquids - prefer volume
  const liquids = ['oil', 'broth', 'stock', 'milk', 'cream', 'juice', 'water', 'wine', 'beer', 
                   'sauce', 'extract', 'vinegar', 'honey', 'syrup', 'cognac', 'liqueur']
  if (liquids.some(l => name.includes(l))) return 'volume'
  
  // Solids - prefer weight
  const weightItems = ['meat', 'chicken', 'turkey', 'beef', 'pork', 'fish', 'sausage', 'bacon',
                       'cheese', 'pasta', 'flour', 'sugar', 'ham', 'shrimp',
                       'salmon', 'cod', 'tuna', 'beans', 'chickpeas', 'oats', 'rice']
  if (weightItems.some(w => name.includes(w))) return 'weight'
  
  // Spices - prefer volume
  const spices = ['salt', 'pepper', 'cinnamon', 'cumin', 'paprika', 'powder', 'seed', 'soda']
  if (spices.some(s => name.includes(s))) return 'volume'
  
  // Produce - prefer count
  const produce = ['apple', 'banana', 'lemon', 'lime', 'orange', 'onion', 'garlic', 'egg',
                   'tomato', 'potato', 'pepper', 'jalapeno', 'shallot', 'carrot']
  if (produce.some(p => name.includes(p))) return 'count'
  
  return 'count'
}

function convertToType(amount, unit, fromType, toType, ingredientName) {
  if (fromType === toType) {
    return { amount, unit, type: toType }
  }
  
  if (fromType === 'count' && (toType === 'weight' || toType === 'volume')) {
    return estimateFromCount(amount, ingredientName, toType)
  }
  
  return null
}

function estimateFromCount(count, ingredientName, targetType) {
  const name = ingredientName.toLowerCase()
  
  const estimates = {
    'tomato': { type: 'weight', perItem: 150, unit: 'g' },
    'onion': { type: 'weight', perItem: 150, unit: 'g' },
    'garlic': { type: 'weight', perItem: 5, unit: 'g' },
    'carrot': { type: 'weight', perItem: 60, unit: 'g' },
    'potato': { type: 'weight', perItem: 200, unit: 'g' },
    'apple': { type: 'weight', perItem: 180, unit: 'g' },
    'lemon': { type: 'weight', perItem: 60, unit: 'g' },
    'egg': { type: 'weight', perItem: 50, unit: 'g' },
    'can': { type: 'weight', perItem: 400, unit: 'g' },
    'bag': { type: 'weight', perItem: 500, unit: 'g' },
  }
  
  for (const [key, value] of Object.entries(estimates)) {
    if (name.includes(key) && value.type === targetType) {
      const totalAmount = count * value.perItem
      if (totalAmount >= 1000 && value.unit === 'g') {
        return { amount: totalAmount / 1000, unit: 'kg', type: 'weight' }
      }
      return { amount: totalAmount, unit: value.unit, type: value.type }
    }
  }
  
  return null
}

function groupAndNormalizeIngredients(ingredients) {
  const grouped = {}
  
  ingredients.forEach(ing => {
    const normalizedName = normalizeIngredientName(ing.name)
    const amount = parseFloat(ing.amount) || 1
    const unit = ing.unit || 'piece'
    
    const normalized = normalizeUnit(amount, unit)
    const preferredType = getPreferredUnitType(normalizedName)
    const key = normalizedName
    
    if (grouped[key]) {
      const existing = grouped[key]
      
      if (existing.type === normalized.type) {
        existing.amount += normalized.amount
      } else {
        const converted = convertToType(normalized.amount, normalized.unit, normalized.type, existing.type, normalizedName)
        if (converted) {
          existing.amount += converted.amount
        } else {
          existing.amount += normalized.amount
          existing.note = 'mixed units'
        }
      }
    } else {
      const displayName = normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1)
      
      let finalUnit = normalized.unit
      let finalAmount = normalized.amount
      let finalType = normalized.type
      
      if (normalized.type === 'count' && preferredType !== 'count') {
        const estimated = estimateFromCount(normalized.amount, normalizedName, preferredType)
        if (estimated) {
          finalAmount = estimated.amount
          finalUnit = estimated.unit
          finalType = estimated.type
        }
      }
      
      grouped[key] = {
        name: displayName,
        amount: finalAmount,
        unit: finalUnit,
        type: finalType
      }
    }
  })
  
  return Object.values(grouped)
}

// NEW: Categorize ingredients one by one
async function categorizeIngredientsIndividually(shoppingListItems) {
  try {
    processingMessage.value = `Categorizing ${shoppingListItems.length} ingredients...`
    
    let completed = 0
    
    // Process each ingredient individually
    for (const item of shoppingListItems) {
      try {
        processingMessage.value = `Categorizing ${completed + 1}/${shoppingListItems.length}: ${item.name}...`
        
        // Use backend endpoint if available
        if (API_ENDPOINT && API_ENDPOINT !== '/api/categorize') {
          const response = await axios.post(API_ENDPOINT, {
            ingredient: item.name
          })
          item.category = response.data.category || 'Others'
        } else if (GEMINI_API_KEY) {
          // Direct API call
          const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
              contents: [{
                parts: [{
                  text: `Categorize this ingredient into ONE category: Dairy, Meat, Vegetable, Fruits, Produce, or Others.
Ingredient: ${item.name}

Respond with ONLY the category name.`
                }]
              }]
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000
            }
          )
          
          item.category = response.data.candidates[0].content.parts[0].text.trim()
        } else {
          item.category = 'Others'
        }
        
        completed++
        
        // Small delay to avoid rate limiting (100ms between requests)
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`Error categorizing ${item.name}:`, error)
        item.category = 'Others'
        completed++
      }
    }
    
    displayToast(`Successfully categorized ${completed} ingredients!`, 'success')
    return shoppingListItems

  } catch (error) {
    console.error('Error in categorization:', error)
    displayToast('Categorization failed. Using default categories.', 'error')
    
    shoppingListItems.forEach(item => {
      item.category = 'Others'
    })
    
    return shoppingListItems
  }
}

// FIXED: Categorization with better error handling
async function categorizeIngredientsBatch(shoppingListItems) {
  try {
    const CHUNK_SIZE = 10 // Reduced for better reliability
    const chunks = []
    
    for (let i = 0; i < shoppingListItems.length; i += CHUNK_SIZE) {
      chunks.push(shoppingListItems.slice(i, i + CHUNK_SIZE))
    }
    
    console.log(`Processing ${shoppingListItems.length} ingredients in ${chunks.length} batches`)
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const ingredientNames = chunk.map(item => item.name)
      const ingredientList = ingredientNames.join(', ')
      
      processingMessage.value = `Categorizing batch ${i + 1}/${chunks.length}...`
      
      try {
        // Use backend endpoint if available, otherwise direct API call
        let categoryMap = {}
        
        if (API_ENDPOINT && API_ENDPOINT !== '/api/categorize') {
          // Backend call (RECOMMENDED)
          const response = await axios.post(API_ENDPOINT, {
            ingredients: ingredientNames
          })
          categoryMap = response.data.categories || {}
        } else if (GEMINI_API_KEY) {
          // Direct API call (only for development)
          const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
              contents: [{
                parts: [{
                  text: `Categorize each ingredient into ONE category: Dairy, Meat, Vegetable, Fruits, Produce, or Others.
Ingredients: ${ingredientList}

Format your response EXACTLY as: ingredient1:Category, ingredient2:Category
Example: milk:Dairy, chicken:Meat, apple:Fruits`
                }]
              }]
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 30000 // 10 second timeout
            }
          )
          
          const result = response.data.candidates[0].content.parts[0].text.trim()
          
          result.split(',').forEach(item => {
            const [ingredient, category] = item.trim().split(':')
            if (ingredient && category) {
              categoryMap[ingredient.toLowerCase().trim()] = category.trim()
            }
          })
        } else {
          throw new Error('No API configuration found')
        }

        // Apply categories
        chunk.forEach(item => {
          const key = item.name.toLowerCase().trim()
          item.category = categoryMap[key] || 'Others'
        })
        
        // Delay between batches
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (error) {
        console.error(`Error processing batch ${i + 1}:`, error)
        displayToast(`Batch ${i + 1} failed, using default categories`, 'error')
        
        // Fallback categorization
        chunk.forEach(item => {
          item.category = 'Others'
        })
      }
    }
    
    return shoppingListItems

  } catch (error) {
    console.error('Error in batch categorization:', error)
    displayToast('AI categorization unavailable. Using default categories.', 'error')
    
    shoppingListItems.forEach(item => {
      item.category = 'Others'
    })
    
    return shoppingListItems
  }
}

// FIXED: Main generation function
async function confirmGenerateShoppingList() {
  if (!shoppingStartDate.value || !shoppingEndDate.value) {
    displayToast('Please select both start and end dates', 'error')
    return
  }

  // Validate date range (max 30 days)
  const startDateObj = new Date(shoppingStartDate.value)
  const endDateObj = new Date(shoppingEndDate.value)
  const daysDiff = (endDateObj - startDateObj) / (1000 * 60 * 60 * 24)
  
  if (daysDiff < 0) {
    displayToast('End date must be after start date', 'error')
    return
  }
  
  if (daysDiff > 30) {
    displayToast('Date range too large. Please select 30 days or less.', 'error')
    return
  }

  isProcessing.value = true
  processingMessage.value = 'Fetching meal plans...'

  try {
    // Fetch meal plans
    const { data: mealPlansData, error: fetchError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .gte('date', shoppingStartDate.value)
      .lte('date', shoppingEndDate.value)

    if (fetchError) throw fetchError

    if (!mealPlansData || mealPlansData.length === 0) {
      displayToast('No meals found in selected date range', 'error')
      isProcessing.value = false
      return
    }

    processingMessage.value = 'Extracting ingredients...'

    // Extract ingredients
    let ingredients = []
    mealPlansData.forEach(meal => {
      if (meal.extendedIngredients && Array.isArray(meal.extendedIngredients)) {
        meal.extendedIngredients.forEach(ing => {
          ingredients.push({
            name: ing.name || 'Unknown',
            amount: parseFloat(ing.amount) || 1,
            unit: ing.unit || 'piece',
          })
        })
      }
    })

    if (ingredients.length === 0) {
      displayToast('No ingredients found in selected meals', 'error')
      isProcessing.value = false
      return
    }

    processingMessage.value = 'Normalizing and grouping ingredients...'

    // Normalize and group ingredients
    const groupedIngredients = groupAndNormalizeIngredients(ingredients)
    
    console.log(`Reduced from ${ingredients.length} to ${groupedIngredients.length} items`)

    let shoppingListItems = groupedIngredients.map(ing => ({
      name: ing.name,
      quantity: Math.round(ing.amount * 100) / 100, // Round to 2 decimals
      unit: ing.unit,
      category: 'Others',
      purchased: false
    }))

    // Categorize ingredients with AI
    processingMessage.value = 'Categorizing ingredients with AI...'
    shoppingListItems = await categorizeIngredientsIndividually(shoppingListItems)

    processingMessage.value = 'Checking existing items...'

    // Fetch existing shopping items
    const { data: existingItems, error: fetchExistingError } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .eq('purchased', false)

    if (fetchExistingError) throw fetchExistingError

    const itemsToInsert = []
    const itemsToUpdate = []

    // Compare and merge
    shoppingListItems.forEach(newItem => {
      const existingItem = existingItems?.find(
        item => item.name.toLowerCase() === newItem.name.toLowerCase() && 
                item.unit === newItem.unit
      )

      if (existingItem) {
        itemsToUpdate.push({
          id: existingItem.id,
          quantity: Math.round((parseFloat(existingItem.quantity) + parseFloat(newItem.quantity)) * 100) / 100,
          category: newItem.category // Update category if improved
        })
      } else {
        itemsToInsert.push({
          ...newItem,
          user_id: currentUser.value.id
        })
      }
    })

    processingMessage.value = 'Saving to database...'

    // FIXED: Bulk update instead of loop
    if (itemsToUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from('shopping_items')
        .upsert(itemsToUpdate, { onConflict: 'id' })
      
      if (updateError) throw updateError
    }

    // Insert new items
    if (itemsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('shopping_items')
        .insert(itemsToInsert)

      if (insertError) throw insertError
    }

    const totalItems = itemsToInsert.length + itemsToUpdate.length
    displayToast(`Shopping list updated! ${totalItems} item(s) processed (${itemsToInsert.length} new, ${itemsToUpdate.length} updated).`, 'success')
    
    isProcessing.value = false
    showShoppingListModal.value = false
    
    // Navigate to shopping page
    router.push('/shopping')
    
  } catch (error) {
    console.error('Error generating shopping list:', error)
    displayToast(`Failed to generate shopping list: ${error.message}`, 'error')
    isProcessing.value = false
  }
}

// Initialize
const init = async () => {
  try {
    currentUser.value = await getCurrentUser()
    
    // Check if API key is configured
    if (!GEMINI_API_KEY && (!API_ENDPOINT || API_ENDPOINT === '/api/categorize')) {
      console.warn('⚠️ No AI categorization configured. Add VITE_GEMINI_API_KEY to .env or set up backend endpoint.')
    }
  } catch (error) {
    console.error('Error initializing:', error)
    router.push('/login')
  }
}

init()
</script>

<style scoped>
.shopping-gen-container {
  position: relative;
}

/* Modal Styles */
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

/* Date Selection Styles */
.date-selection-info {
  background: rgba(255, 248, 240, 0.5);
  border-radius: 12px;
  padding: 1rem;
}

.info-card {
  display: flex;
  justify-content: space-around;
  gap: 1rem;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.step-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s;
}

.step-badge.active {
  background: #10b981;
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.step-text {
  font-weight: 500;
  color: #666;
}

.date-range-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1.5rem 0;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-input-group label {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.date-input-wrapper {
  position: relative;
}

.date-input {
  cursor: pointer;
  padding-right: 2.5rem;
}

.date-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.calendar-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #10b981;
  pointer-events: none;
  font-size: 1.1rem;
}

.selected-range {
  text-align: center;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 2px dashed #10b981;
  color: #1a1a1a;
}

.selected-range i {
  color: #10b981;
}

/* Toast Notification */
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
@media (max-width: 768px) {
  .info-card {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .date-range-selector {
    grid-template-columns: 1fr;
  }
  
  .modal-content-custom {
    margin: 1rem;
  }
}
</style>