<template>
  <AppLayout>
    <AnimatedBackground />
    
    <div class="shopping-page container py-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <!-- Header -->
            <div class="shopping-header">
                <div class="container">
                <div class="header-content">
                    <div class="shopping-text">
                    <h1>
                        Shopping List
                    </h1>
                    </div>
                </div>
                </div>
            </div>

            <!-- Sorting Dropdown -->
            <div class="sort-dropdown d-flex align-items-center gap-2">
            <label class="fw-semibold me-1 sort-label">Sort by:</label>
            <div class="custom-select-wrapper">
                <select v-model="sortMode" class="form-select custom-select">
                <option value="category">Category</option>
                <option value="alphabet">A–Z</option>
                </select>
            </div>
            </div>  
        </div>   

      <div class="container my-4">

        <!-- Add Item Card -->
        <div class="add-item-card mb-4">
          <div class="add-item-form">
            <!-- Item Name -->
            <div class="input-wrapper">
              <input 
                v-model="newItemName"
                type="text" 
                :class="['form-control', 'item-input', { 'is-invalid': nameError}]" 
                placeholder="Item name"
                @keyup.enter="addItem"
              >
              <div v-if="nameError" class="error-text-below">
                {{ nameError }}
              </div>
            </div>
            
            <!-- Quantity -->
            <div class="input-wrapper">
              <input 
                v-model="newItemQuantity"
                type="text" 
                :class="['form-control', 'quantity-input', { 'is-invalid': qtyError }]" 
                placeholder="Quantity"
                @input="validateQty"
                @keyup.enter="addItem"
              >
              <div v-if="qtyError" class="error-text-below">
                {{ qtyError }}
              </div>
            </div>
            
            <!-- Unit (with autocomplete) -->
            <div class="input-wrapper">
              <div class= "unit-wrapper">
                <div class="autocomplete-wrapper">
                  <input
                    v-model="newItemUnit"
                    @input="handleInput"
                    @keydown="handleKeydown"
                    type="text"
                    :class="['form-control', 'unit-input', { 'is-invalid': unitError }]"
                    placeholder="Unit (e.g., kg)"
                    autocomplete="off"
                  />
                  
                  <!-- Dropdown suggestions -->
                  <ul v-if="showSuggestions && filteredUnits.length > 0" class="suggestions-dropdown">
                    <li
                      v-for="(unit, index) in filteredUnits"
                      :key="unit"
                      :class="['suggestion-item', { 'active': index === selectedIndex }]"
                      @mousedown.prevent="selectUnit(unit)"
                      @mouseenter="selectedIndex = index"
                    >
                      {{ unit }}
                    </li>
                  </ul>
                </div>
              </div>
              <div v-if="unitError" class="error-text-below">
                {{ unitError }}
              </div>
            </div>
            
            <!-- Category -->
            <div class="input-wrapper"> 
              <input 
                v-model="newItemCategory"
                placeholder="Category"
                :class="['form-control', 'category-select', { 'is-invalid': categoryError }]"
                @input="capitalizeCategory"
              />
              <div v-if="categoryError" class="error-text-below">
                {{ categoryError }}
              </div>                 
            </div>
            
            <!-- Add Button -->
            <button @click="addItem" class="btn btn-primary add-btn">
              <i class="bi bi-plus-lg"></i>
              Add
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-2">Loading shopping list...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="shoppingItems.length === 0" class="empty-state">
          <i class="bi bi-cart-x"></i>
          <h3>Your shopping list is empty</h3>
          <p>Add items manually or generate a list from your meal plans</p>
        </div>

        <!-- Shopping List -->
        <div v-else class="shopping-list-card">
          <div class="list-header">
            <span class="header-label">Item</span>
            <span class="header-label quantity-header">Quantity</span>
          </div>

          <div class="list-body">
            <!-- Category Groups -->
            <div 
              v-for="category in filteredCategories" 
              :key="category.name"
              class="category-group"
            >
              <div class="category-header" @click="toggleCategory(category.name)">
                <i :class="['bi', isCategoryExpanded(category.name) ? 'bi-chevron-down' : 'bi-chevron-right']"></i>
                <span class="category-name">{{ category.name }}</span>

                <!-- Clear Category Button -->
                <button
                  v-if="category.items.length > 0"
                  class="btn-clear-category"
                  @click.stop="confirmClearCategory(category.name)"
                  title="Clear all items in this category"
                >
                  <i class="bi bi-trash"></i>
                  Clear
                </button>

                <span class="category-count">{{ category.items.length }}</span>
          
              </div>

              <div v-show="isCategoryExpanded(category.name)" class="category-items">
                <div 
                  v-for="item in category.items" 
                  :key="item.id"
                  :class="['list-item', { 'purchased': item.purchased }]"
                >
                  <input 
                    type="checkbox" 
                    :checked="item.purchased"
                    @change="togglePurchased(item.id)"
                    class="item-checkbox"
                  >
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-quantity">{{ item.quantity }} {{ item.unit }}</span>
                  <button @click="deleteItem(item.id)" class="btn-delete">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="showToast" class="toast-notification">
      <i class="bi bi-check-circle-fill me-2"></i>
      {{ toastMessage }}
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, getCurrentUser } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import { IngredientCategorizer } from '@/utils/IngredientsCategorizer.js'
import Swal from "sweetalert2"

const router = useRouter()
const currentUser = ref(null)

// ---------- STATE ----------
const loading = ref(true)
const newItemName = ref('')
const newItemQuantity = ref('')
const newItemCategory = ref('')
const shoppingItems = ref([])
const expandedCategories = ref({})
const sortMode = ref('category') // add sorting mode

// ---------- TOAST ----------
const showToast = ref(false)
const toastMessage = ref('')

// ---------- UNITS ----------
const newItemUnit = ref('')
const showSuggestions = ref(false)
const selectedIndex = ref(0)

// ---------- ERROR MSG ----------
const nameError = ref('')
const qtyError = ref('')
const unitError = ref('')
const categoryError = ref('')

const validateName = () => {
  if (!newItemName.value.trim()) {
    nameError.value = 'Item name is required'
    return false
  } 
  else {
    nameError.value = ''
    return true
  }
}

const validateQty = () => {
  const value = newItemQuantity.value.trim()
  
  if (!value) {
    qtyError.value = 'Quantity is required'
    return false
  } 
  else if (!/^\d+(\.\d+)?$/.test(value)) {
    qtyError.value = 'Please enter a valid number'
    return false
  }
  else {
    qtyError.value = ''
    return true
  }
}

const validateUnit = () => {
  const value = newItemUnit.value.trim()
  
  if (!value) {
    unitError.value = 'Unit is required'
    return false
  } else {
    unitError.value = ''
    return true
  }
}

const validateCategory = () => {
  const value = newItemCategory.value.trim()
  
  if (!value) {
    categoryError.value = 'Category is required'
    return false
  } else {
    categoryError.value = ''
    return true
  }
}

// Available units
const units = [
  'piece', 'kg', 'g', 'lbs', 'oz', 
  'gallon', 'liter', 'carton', 'bottle', 'can', 
  'box', 'bag', 'bunch', 'loaf', 'dozen', 'cup'
]

function displayToast(message) {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => (showToast.value = false), 3000)
}

// ---------- AUTO UNITS FILTER ----------
// Filter units based on input
const filteredUnits = computed(() => {
  if (!newItemUnit.value) return []
  
  const input = newItemUnit.value.toLowerCase()
  return units.filter(unit => unit.toLowerCase().startsWith(input))
})

// Ghost text suggestion (first match)
const suggestion = computed(() => {
  if (!newItemUnit.value || filteredUnits.value.length === 0) return ''
  
  const firstMatch = filteredUnits.value[0]
  return firstMatch.slice(newItemUnit.value.length)
})

// Handle input
const handleInput = () => {
  showSuggestions.value = true
  selectedIndex.value = 0
}

// Handle keyboard navigation
const handleKeydown = (e) => {
  if (!showSuggestions.value || filteredUnits.value.length === 0) return

  switch (e.key) {
    case 'Tab':
    case 'ArrowRight':
      // Accept suggestion with Tab or Right Arrow
      if (suggestion.value) {
        e.preventDefault()
        newItemUnit.value = filteredUnits.value[0]
        showSuggestions.value = false
      }
      break
      
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredUnits.value.length - 1)
      break
      
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
      
    case 'Enter':
      e.preventDefault()
      if (filteredUnits.value.length > 0) {
        selectUnit(filteredUnits.value[selectedIndex.value])
      }
      break
      
    case 'Escape':
      showSuggestions.value = false
      break
  }
}

// Select a unit
const selectUnit = (unit) => {
  newItemUnit.value = unit
  showSuggestions.value = false
  selectedIndex.value = 0
}

watch(
  () => newItemName.value,
  (newItem) => {
    if (!newItem || newItem.trim() === '') {
      newItemCategory.value = ''
    } else {
      newItemCategory.value = IngredientCategorizer.categorizeIngredient(newItem)
    }
  }
)

// Clear all items in a specific category
const confirmClearCategory = async (categoryName) => {
  // Find items in the category
  const categoryItems = filteredCategories.value.find(c => c.name === categoryName)?.items || []
  
  if (!categoryItems.length) {
    await Swal.fire({
      icon: 'info',
      title: 'Nothing to clear',
      text: `No items in ${categoryName} category.`,
      confirmButtonColor: '#6b46c1'
    })
    return
  }

  // SweetAlert2 confirmation
  const result = await Swal.fire({
    title: `Are you sure?`,
    text: `You are about to delete ${categoryItems.length} item(s) from ${categoryName}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#ff6b1a',
    cancelButtonColor: '#6b46c1'
  })

  if (!result.isConfirmed) return

  // Delete items by ID
  try {
    const idsToDelete = categoryItems.map((i) => i.id)
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .in('id', idsToDelete)
      .eq('user_id', currentUser.value.id)

    if (error) throw error

    await fetchShoppingItems()
    await Swal.fire({
      icon: 'success',
      title: 'Deleted!',
      text: `${categoryItems.length} item(s) from ${categoryName} have been removed.`,
      confirmButtonColor: '#6b46c1'
    })
  } catch (err) {
    console.error('Error clearing category:', err)
    await Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: 'Failed to clear category: ' + (err.message || err),
      confirmButtonColor: '#6b46c1'
    })
  }
}

// ---------- FETCH SHOPPING ITEMS ----------
async function fetchShoppingItems() {
  try {
    if (!currentUser.value) return router.push('/login')

    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('user_id', currentUser.value.id)

    if (error) throw error

    shoppingItems.value = data || []

    // Initialize all categories collapsed
    const uniqueCategories = [...new Set(shoppingItems.value.map(i => i.category || 'Other'))]
    expandedCategories.value = Object.fromEntries(uniqueCategories.map(c => [c, false]))
  } catch (error) {
    console.error('Error fetching shopping items:', error)
  } finally {
    loading.value = false
  }
}

// ---------- GROUPED + SORTED DATA ----------
const groupedByCategory = computed(() => {
  const grouped = {}
  shoppingItems.value.forEach(i => {
    const cat = i.category || 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(i)
  })
  return grouped
})

// Sort categories alphabetically, “Other” last
const sortedCategories = computed(() => {
  const entries = Object.entries(groupedByCategory.value)
  entries.sort((a, b) => {
    if (a[0] === 'Other') return 1
    if (b[0] === 'Other') return -1
    return a[0].localeCompare(b[0])
  })
  return Object.fromEntries(entries)
})

// Sort items alphabetically *within each category*
const sortedItemsByCategory = computed(() => {
  const sorted = {}
  Object.entries(sortedCategories.value).forEach(([cat, items]) => {
    sorted[cat] = [...items].sort((a, b) => a.name.localeCompare(b.name))
  })
  return sorted
})

// Final computed array used in template
const filteredCategories = computed(() => {
  if (sortMode.value === 'alphabet') {
    // Flatten and sort all items alphabetically
    const allItems = shoppingItems.value.slice().sort((a, b) => a.name.localeCompare(b.name))
    return [{ name: 'All Items (A–Z)', items: allItems }]
  }

  // Default: grouped by category
  return Object.entries(sortedItemsByCategory.value).map(([name, items]) => ({
    name,
    items,
  }))
})

// ---------- CATEGORY TOGGLE ----------
function toggleCategory(category) {
  expandedCategories.value[category] = !expandedCategories.value[category]
}
function isCategoryExpanded(category) {
  return !!expandedCategories.value[category]
}

// ---------- ITEM ACTIONS ----------
async function addItem() {
  const isNameValid = validateName()
  const isQtyValid = validateQty()
  const isUnitValid = validateUnit()
  const isCatValid = validateCategory()

  if (!isNameValid || !isQtyValid || !isUnitValid || !isCatValid) {
    await Swal.fire({
      icon: 'warning',
      title: 'Please check your inputs',
      text: 'Fix the highlighted errors before adding',
      confirmButtonColor: '#6b46c1'
    })
    return
  }

  // Check for duplicate item (case-insensitive)
  const itemName = newItemName.value.trim().toLowerCase()
  const existingItem = shoppingItems.value.find(
    item => item.name.toLowerCase() === itemName
  )

  if (existingItem) {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Item Already Exists',
      html: `
        <p>"${existingItem.name}" is already in your list.</p>
        <p><strong>Current:</strong> ${existingItem.quantity} ${existingItem.unit}</p>
        <p><strong>Adding:</strong> ${newItemQuantity.value} ${newItemUnit.value}</p>
      `,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Update quantity',
      denyButtonText: 'Add as separate',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ff6b1a',
      denyButtonColor: '#6b46c1',
      cancelButtonColor: '#9ca3af'
    })

    if (result.isConfirmed) {
      // Update existing item's quantity
      try {
        const newQty = parseFloat(existingItem.quantity) + parseFloat(newItemQuantity.value || 1)
        
        const { error } = await supabase
          .from('shopping_items')
          .update({ 
            quantity: newQty.toString(),
            unit: newItemUnit.value 
          })
          .eq('id', existingItem.id)
          .eq('user_id', currentUser.value.id)

        if (error) throw error

        existingItem.quantity = newQty.toString()
        existingItem.unit = newItemUnit.value

        // Clear form
        newItemName.value = ''
        newItemQuantity.value = ''
        newItemUnit.value = ''
        newItemCategory.value = 'Others'
        nameError.value = ''
        qtyError.value = ''
        unitError.value = ''
        categoryError.value = ''

        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: `${existingItem.name} quantity updated to ${newQty} ${existingItem.unit}`,
          confirmButtonColor: '#6b46c1',
          timer: 2000,
          showConfirmButton: false
        })
        return
      } catch (error) {
        console.error('Error updating item:', error)
        await Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to update item: ' + (error.message || error),
          confirmButtonColor: '#6b46c1'
        })
        return
      }
    } else if (result.isDenied) {
      // Continue to add as separate item
    } else {
      // Cancelled
      return
    }
  }

  try {
    const newItem = {
      user_id: currentUser.value.id,
      name: newItemName.value.trim(),
      quantity: newItemQuantity.value.trim() || '1',
      unit: newItemUnit.value,
      category: newItemCategory.value,
      purchased: false
    }

    const { data, error } = await supabase
      .from('shopping_items')
      .insert([newItem])
      .select()

    if (error) throw error

    const added = data[0]
    shoppingItems.value.unshift(added)

    // Ensure category exists and EXPAND it
    expandedCategories.value[added.category] = true

    // Clear form and errors
    newItemName.value = ''
    newItemQuantity.value = ''
    newItemUnit.value = ''
    newItemCategory.value = 'Others'
    nameError.value = ''
    qtyError.value = ''
    unitError.value = ''
    categoryError.value = ''
    
    await Swal.fire({
      icon: 'success',
      title: 'Added!',
      text: `${added.name} has been added to your shopping list.`,
      confirmButtonColor: '#6b46c1',
      timer: 2000,
      showConfirmButton: false
    })
  } catch (error) {
    console.error('Error adding item:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: 'Failed to add item: ' + (error.message || error),
      confirmButtonColor: '#6b46c1'
    })
  }
}

async function togglePurchased(itemId) {
  try {
    const item = shoppingItems.value.find(i => i.id === itemId)
    if (!item) return

    const newPurchasedState = !item.purchased
    const { error } = await supabase
      .from('shopping_items')
      .update({ purchased: newPurchasedState })
      .eq('id', itemId)

    if (error) throw error

    item.purchased = newPurchasedState
  } catch (error) {
    console.error('Error toggling purchased:', error)
    displayToast('Failed to update item')
  }
}

async function deleteItem(itemId) {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'Do you want to delete this item from your shopping list?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#ff6b1a',
    cancelButtonColor: '#6b46c1'
  })

  if (!result.isConfirmed) return

  try {
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', currentUser.value.id) // ← Add user_id check for security
    
    if (error) throw error

    await fetchShoppingItems() // ← Better than manual filter

    await Swal.fire({
      title: 'Deleted!',
      text: 'The item has been removed from your shopping list.',
      icon: 'success',
      confirmButtonColor: '#6b46c1'
    })
  } catch (error) {
    console.error('Error deleting item:', error)
    await Swal.fire({
      title: 'Error!',
      text: 'Failed to delete item: ' + (error.message || error),
      icon: 'error',
      confirmButtonColor: '#6b46c1'
    })
  }
}

// ---------- INIT ----------
onMounted(async () => {
  try {
    currentUser.value = await getCurrentUser()
    if (!currentUser.value) return router.push('/login')
    await fetchShoppingItems()
  } catch (err) {
    console.error('Error initializing:', err)
    router.push('/login')
  }
})
</script>


<style scoped>
.shopping-page {
  min-height: 100vh;
  padding-bottom: 4rem;
}

/* Header */
.shopping-header {
  padding: 2rem 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shopping-text h1 {
  color: #6b46c1;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.shopping-text p {
  color: #d97706;
  margin: 0;
  font-size: 0.95rem;
}

/*units Dropdwon */
.autocomplete-wrapper {
  position: relative;
  flex: 0 0 140px;
  z-index: 100;
}

.unit-wrapper{
  width: 180px;
}

/* Dropdown */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestion-item {
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: #f0f0f0;
}

.suggestion-item:first-child {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}

.suggestion-item:last-child {
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}

/* Sort Dropdown Styling */
.sort-dropdown {
  background: rgba(255, 255, 255, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(8px);
  width: fit-content;
}

.sort-label {
  color: #1a1a1a;
  font-weight: 600;
  font-size: 0.9rem;
}

.custom-select-wrapper {
  position: relative;
}

.custom-select {
    width: 140px;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  width: fit-content;
}

.filter-btn {
  padding: 0.5rem 1.5rem;
  border: none;
  background: transparent;
  color: #666;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: rgba(255, 107, 26, 0.1);
  color: #ff6b1a;
}

.filter-btn.active {
  background: #ff6b1a;
  color: white;
}

/* Add Item Card */
.add-item-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: visible;
  position: relative;
  z-index: 10;
}

.add-item-form {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  width: 100%;
}

.input-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Item name - fills remaining space */
.input-wrapper:first-child {
  flex: 1;
  min-width: 150px;
}

/* Quantity - fixed width */
.input-wrapper:nth-child(2) {
  flex: 0 0 170px;
}

/* Unit - fixed width */

/* Category - fixed width */
.input-wrapper:nth-child(4) {
  flex: 0 0 160px;
}

/* Button - auto width */
.add-btn {
  flex: 0 0 auto;
  align-self: flex-start;
  margin-top: 0;
}

/* Autocomplete specific */
.autocomplete-wrapper {
  position: relative;
  width: 100%;
}

.is-invalid {
  border-color: #dc2626 !important;
  background-color: #fef2f2 !important;
}

.error-text-below {
  color: #dc2626;
  font-size: 0.8rem;
  margin-top: 4px;
  font-weight: 500;
}

.add-btn {
  background: #ff6b1a;
  border: none;
  padding: 0.5rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  flex: 0 0 auto;
}

.add-btn:hover {
  background: #e55a0f;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
}

.empty-state i {
  font-size: 4rem;
  color: #d97706;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
}

/* Shopping List Card */
.shopping-list-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.list-header {
  display: grid;
  grid-template-columns: 1fr auto;
  padding: 1rem 1.5rem;
  background: rgba(255, 248, 240, 0.5);
  border-bottom: 1px solid rgba(217, 119, 6, 0.1);
}

.header-label {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quantity-header {
  text-align: right;
  padding-right: 3rem;
}

.list-body {
  padding: 0.5rem;
}

/* Category */
.category-group {
  margin-bottom: 0.5rem;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 248, 240, 0.8);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-header:hover {
  background: rgba(255, 248, 240, 1);
}

.category-header i {
  color: #d97706;
  font-size: 0.875rem;
}

.category-name {
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
}

.category-count {
  background: #d97706;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

/* Category Items */
.category-items {
  padding: 0.5rem 0 0.5rem 2rem;
}

.list-item {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.list-item:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 107, 26, 0.2);
}

.list-item.purchased {
  opacity: 0.6;
}

.list-item.purchased .item-name {
  text-decoration: line-through;
  color: #999;
}

.item-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #ff6b1a;
}

.item-name {
  font-weight: 500;
  color: #1a1a1a;
}

.item-quantity {
  color: #666;
  font-size: 0.9rem;
  text-align: right;
}

.btn-delete {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  opacity: 0;
}

.list-item:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  background: rgba(220, 38, 38, 0.1);
}

.btn-clear-category {
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  border: 1px solid rgba(180, 83, 9, 0.15);
  background: transparent;
  color: #b45309;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto; /* ← Pushes button to the right */
  opacity: 0;
  transform: translateX(10px);
}

.category-header:hover .btn-clear-category {
  opacity: 1;
  transform: translateX(0);
}

.btn-clear-category:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(107, 70, 193, 0.08);
  background: rgba(107, 70, 193, 0.04);
}

.btn-clear-category i {
  font-size: 0.7rem;
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
  .add-item-form {
    flex-direction: column;
  }

  .item-input,
  .quantity-input,
  .unit-input,
  .category-select,
  .add-btn {
    width: 100%;
  }

  .list-item {
    grid-template-columns: auto 1fr;
    gap: 0.5rem;
  }

  .item-quantity {
    grid-column: 2;
    text-align: left;
    font-size: 0.8rem;
  }

  .btn-delete {
    grid-column: 2;
    justify-self: end;
    opacity: 1;
  }

  .category-items {
    padding-left: 1rem;
  }
}
</style>