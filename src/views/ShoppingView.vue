<template>
  <AppLayout>
    <AnimatedBackground />
    
    <div class="shopping-page">
      <!-- Header -->
      <div class="shopping-header">
        <div class="container">
          <div class="header-content">
            <div class="shopping-text">
              <h1>
                <i class="bi bi-cart3"></i>
                Shopping List
              </h1>
              <p>{{ toBuyCount }} to buy • {{ purchasedCount }} purchased • {{ totalCount }} total</p>
            </div>
          </div>
        </div>
      </div>

      <div class="container my-4">
        <!-- Filter Tabs -->
        <div class="filter-tabs mb-4">
          <button 
            :class="['filter-btn', { 'active': filterView === 'all' }]"
            @click="filterView = 'all'"
          >
            All
          </button>
          <button 
            :class="['filter-btn', { 'active': filterView === 'toBuy' }]"
            @click="filterView = 'toBuy'"
          >
            To Buy
          </button>
          <button 
            :class="['filter-btn', { 'active': filterView === 'purchased' }]"
            @click="filterView = 'purchased'"
          >
            Purchased
          </button>
        </div>

        <!-- Add Item Card -->
        <div class="add-item-card mb-4">
          <div class="add-item-form">
            <input 
              v-model="newItemName"
              type="text" 
              class="form-control item-input" 
              placeholder="Item name"
              @keyup.enter="addItem"
            >
            <input 
              v-model="newItemQuantity"
              type="text" 
              class="form-control quantity-input" 
              placeholder="Quantity"
              @keyup.enter="addItem"
            >
            <select v-model="newItemUnit" class="form-select unit-select">
              <option value="piece">piece</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="lbs">lbs</option>
              <option value="oz">oz</option>
              <option value="gallon">gallon</option>
              <option value="liter">liter</option>
              <option value="carton">carton</option>
              <option value="bottle">bottle</option>
              <option value="can">can</option>
              <option value="box">box</option>
              <option value="bag">bag</option>
              <option value="bunch">bunch</option>
              <option value="loaf">loaf</option>
              <option value="dozen">dozen</option>
              <option value="cup">cup</option>
            </select>
            <select v-model="newItemCategory" class="form-select category-select">
              <option value="Dairy">Dairy</option>
              <option value="Meat">Meat</option>
              <option value="Vegetable">Vegetable</option>
              <option value="Fruits">Fruits</option>
              <option value="Produce">Produce</option>
              <option value="Others">Others</option>
            </select>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, getCurrentUser } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'

const router = useRouter()
const currentUser = ref(null)

// State
const loading = ref(true)
const filterView = ref('all') // 'all', 'toBuy', 'purchased'
const newItemName = ref('')
const newItemQuantity = ref('')
const newItemUnit = ref('piece')
const newItemCategory = ref('Others')
const expandedCategories = ref(['Dairy', 'Meat', 'Vegetable', 'Fruits', 'Produce', 'Others'])
const shoppingItems = ref([])

// Toast
const showToast = ref(false)
const toastMessage = ref('')

// Computed
const toBuyCount = computed(() => {
  return shoppingItems.value.filter(item => !item.purchased).length
})

const purchasedCount = computed(() => {
  return shoppingItems.value.filter(item => item.purchased).length
})

const totalCount = computed(() => {
  return shoppingItems.value.length
})

const filteredItems = computed(() => {
  if (filterView.value === 'toBuy') {
    return shoppingItems.value.filter(item => !item.purchased)
  } else if (filterView.value === 'purchased') {
    return shoppingItems.value.filter(item => item.purchased)
  }
  return shoppingItems.value
})

const filteredCategories = computed(() => {
  const categories = {}
  
  filteredItems.value.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = {
        name: item.category,
        items: []
      }
    }
    categories[item.category].items.push(item)
  })
  
  return Object.values(categories).sort((a, b) => a.name.localeCompare(b.name))
})

// Methods
function displayToast(message) {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

async function fetchShoppingItems() {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    shoppingItems.value = data || []
  } catch (error) {
    console.error('Error fetching shopping items:', error)
    displayToast('Failed to load shopping list')
  } finally {
    loading.value = false
  }
}

async function addItem() {
  if (!newItemName.value.trim()) {
    displayToast('Please enter an item name')
    return
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

    // Add to local state
    shoppingItems.value.unshift(data[0])
    
    // Reset form
    newItemName.value = ''
    newItemQuantity.value = ''
    newItemUnit.value = 'piece'
    newItemCategory.value = 'Others'
    
    displayToast('Item added successfully')
  } catch (error) {
    console.error('Error adding item:', error)
    displayToast('Failed to add item')
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

    // Update local state
    item.purchased = newPurchasedState
  } catch (error) {
    console.error('Error toggling purchased:', error)
    displayToast('Failed to update item')
  }
}

async function deleteItem(itemId) {
  if (!confirm('Are you sure you want to delete this item?')) return

  try {
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error

    // Remove from local state
    shoppingItems.value = shoppingItems.value.filter(i => i.id !== itemId)
    
    displayToast('Item deleted successfully')
  } catch (error) {
    console.error('Error deleting item:', error)
    displayToast('Failed to delete item')
  }
}

function toggleCategory(categoryName) {
  const index = expandedCategories.value.indexOf(categoryName)
  if (index > -1) {
    expandedCategories.value.splice(index, 1)
  } else {
    expandedCategories.value.push(categoryName)
  }
}

function isCategoryExpanded(categoryName) {
  return expandedCategories.value.includes(categoryName)
}

// Initialize
onMounted(async () => {
  try {
    currentUser.value = await getCurrentUser()
    await fetchShoppingItems()
  } catch (error) {
    console.error('Error initializing:', error)
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
  color: #d97706;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.shopping-text p {
  color: #d97706;
  margin: 0;
  font-size: 0.95rem;
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
}

.add-item-form {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.item-input {
  flex: 1;
  min-width: 200px;
}

.quantity-input {
  width: 120px;
}

.unit-select {
  width: 140px;
}

.category-select {
  width: 140px;
}

.add-btn {
  background: #ff6b1a;
  border: none;
  padding: 0.5rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
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
  .unit-select,
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