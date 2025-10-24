<template>
  <AppLayout>
    <AnimatedBackground />

    <div class="pantry-page">
      <!-- Header -->
      <div class="pantry-header">
        <div class="container">
          <div class="header-content">
            <div class="pantry-text">
              <h1>My Pantry</h1>
              <p>Track your ingredients and reduce food waste</p>
            </div>
            <button @click="showAddModal = true" class="btn-add-item">
              <i class="bi bi-plus-lg"></i>
              <span>Add Item</span>
            </button>
          </div>
        </div>
      </div>

      <div class="container my-4">
        <!-- Search and Filter Card -->
        <div class="search-filter-card">
          <div class="search-filter-content">
            <div class="search-box-wrapper">
              <i class="bi bi-search search-icon"></i>
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Search items..."
                class="search-input"
              />
            </div>

            <select v-model="filters.category" class="category-filter">
              <option value="">All Categories</option>
              <option v-for="cat in dbCategories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>

          <!-- Sort by expiration -->
          <div class="sort-option mt-3">
            <label class="sort-label">
              <input type="checkbox" v-model="sortByExpiration" />
              Sort by Expiration Date (Soonest First)
            </label>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div
            class="stat-card total-card"
            :class="{ active: !showExpiredOnly && !showExpiringOnly }"
            @click="showAllItems"
          >
            <div class="stat-header">
              <span>Total Items</span>
              <i class="bi bi-box-seam stat-icon"></i>
            </div>
            <div class="stat-value">{{ filteredItems.length }}</div>
            <button
              v-if="!showExpiredOnly && !showExpiringOnly && filteredItems.length"
              class="btn-clear-stat"
              @click.stop="confirmClear('total')"
              title="Clear all visible (Total) items"
            >
              Clear All Items
            </button>
          </div>

          <div
            class="stat-card expired-card"
            :class="{ active: showExpiredOnly }"
            @click="toggleExpiredOnly"
          >
            <div class="stat-header">
              <span>Expired Items</span>
              <i class="bi bi-exclamation-octagon stat-icon expired"></i>
            </div>
            <div class="stat-value expired">{{ expiredCount }}</div>
            <button
              v-if="showExpiredOnly && expiredCount"
              class="btn-clear-stat"
              @click.stop="confirmClear('expired')"
              title="Clear all visible expired items"
            >
              Clear All Expired Items
            </button>
          </div>

          <div
            class="stat-card expiring-card"
            :class="{ active: showExpiringOnly }"
            @click="toggleExpiringOnly"
          >
            <div class="stat-header">
              <span>Expiring Soon</span>
              <i class="bi bi-calendar-x stat-icon expiring"></i>
            </div>
            <div class="stat-value expiring">{{ expiringSoonCount }}</div>
            <button
              v-if="showExpiringOnly && expiringSoonCount"
              class="btn-clear-stat"
              @click.stop="confirmClear('expiring')"
              title="Clear all visible expiring items"
            >
              Clear All Expiring Soon Items
            </button>
          </div>
        </div>

        <!-- Table or Empty -->
        <div v-if="filteredItems.length === 0" class="empty-state">
          <i class="bi bi-basket"></i>
          <h3>Your pantry is empty</h3>
          <p>Start adding ingredients to track your inventory</p>
        </div>

        <!-- Table Container -->
        <div class="pantry-table-container">
          <div class="pantry-table-scroll-area">
            <div class="pantry-table-header">
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Expiration Date</th>
                    <th>Days to Expiration</th>
                    <th>Status</th>
                    <th class="actions-col">Actions</th>
                  </tr>
                </thead>
              </table>
            </div>

            <div class="pantry-table-body" ref="scrollBody">
              <table>
                <tbody>
                  <tr
                    v-for="item in displayedItems"
                    :key="item.id"
                    :class="['table-row', getFreshnessClass(item.expiration)]"
                  >
                    <td class="name-col">{{ item.name }}</td>
                    <td>{{ item.category }}</td>
                    <td>{{ item.quantity }} {{ item.unit }}</td>
                    <td>{{ formatDate(item.expiration) }}</td>
                    <td>{{ getDaysUntil(item.expiration) }}</td>
                    <td>
                      <span :class="['freshness-badge', getFreshnessClass(item.expiration)]">
                        {{ getFreshnessLabel(item.expiration) }}
                      </span>
                    </td>
                    <td class="actions-col">
                      <button @click="startEdit(item)" class="btn-edit-table" title="Edit">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button @click="deleteItem(item.id)" class="btn-delete-table" title="Delete">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div v-if="showAddModal || editingItem" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <div>
              <h3>{{ editingItem ? 'Edit Item' : 'Add New Item' }}</h3>
              <p>{{ editingItem ? 'Update item in your pantry inventory' : 'Add a new item to your pantry inventory' }}</p>
            </div>
            <button @click="closeModal" class="btn-close-modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form @submit.prevent="editingItem ? updateItem() : addItem()">
            <!-- Item Name  -->
            <div class="form-group">
              <label>Item Name</label>
              <div class="item-name-row" style="display:flex; gap:0.5rem;">
                <input
                  type="text"
                  v-model="form.name"
                  placeholder="e.g., Whole Wheat Flour"
                  required
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Category</label>
              <input type="text" v-model="form.category" class="form-input" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Quantity</label>
                <div class="quantity-row">
                  <input
                    type="number"
                    v-model="form.quantity"
                    min="0"
                    step="any"
                    placeholder="0"
                    required
                    class="form-input"
                  />
                  <select v-model="form.unit" required class="unit-select">
                    <option value="pcs">pcs</option>
                    <option value="grams">grams</option>
                    <option value="ml">ml</option>
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="expiration" class="form-label">Expiration Date</label>
              <div class="custom-date-wrapper">
                <input
                  id="expiration"
                  type="date"
                  v-model="form.expiration"
                  @focus="calendarVisible = true"
                  readonly
                  placeholder="Select a date"
                  class="custom-date-input"
                  @click="toggleCalendar"
                />
                <i class="bi bi-calendar3 calendar-icon"></i>


                <!-- Mini Calendar Dropdown -->
                <div v-if="showCalendar" class="calendar-dropdown-wrapper">
                  <MiniCalendar
                    :currentWeek="new Date()"
                    :showTodayButton="false"
                    :openAbove="true"
                    :highlightToday="true"
                    @select-date="handleDateSelect"
                  />
                </div>
              </div>
            </div>

            <button type="submit" :disabled="loading" class="btn-submit">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ editingItem ? 'Update Item' : 'Add to Pantry' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, getCurrentUser } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import MiniCalendar from '@/components/MiniCalendar.vue'
import { IngredientCategorizer } from '@/utils/IngredientsCategorizer.js'
import Swal from "sweetalert2"

const router = useRouter()
const loading = ref(false)
const currentUser = ref(null)
const pantryData = ref([])
const editingItem = ref(null)
const showAddModal = ref(false)
const searchQuery = ref('')
const sortByExpiration = ref(false)

// add categories into filter
const dbCategories = computed(() => {
  const cats = new Set(pantryData.value.map(item => item.category).filter(Boolean))
  return Array.from(cats).sort()
})

// Form fields
const form = ref({
  name: '',
  category: '',
  quantity: '',
  unit: 'pcs',
  expiration: ''
})

// Filter state
const filters = ref({ category: '' })

watch(
  () => form.value.name,
  (newName) => {
    if (!newName || newName.trim() === '') {
      form.value.category = ''
    } else {
      form.value.category = IngredientCategorizer.categorizeIngredient(newName)
    }
  }
)


// --------------------
// Helper Functions
// --------------------
const getDaysUntil = (dateStr) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(dateStr)
  exp.setHours(0, 0, 0, 0)
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.ceil((exp - today) / msPerDay)
}

const getFreshnessClass = (dateStr) => {
  const days = getDaysUntil(dateStr)
  if (days < 0) return 'expired'
  if (days <= 2) return 'critical'
  if (days <= 5) return 'warning'
  return 'fresh'
}

const getFreshnessLabel = (dateStr) => {
  const days = getDaysUntil(dateStr)
  if (days < 0) return 'Expired'
  if (days <= 2) return 'Going bad!'
  if (days <= 5) return 'Use soon'
  return 'Fresh'
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
}

// --------------------
// Computed Filters
// --------------------
const filteredItems = computed(() => {
  let items = [...pantryData.value]

  if (searchQuery.value) {
    items = items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (filters.value.category) {
    items = items.filter((item) => item.category === filters.value.category)
  }

  if (sortByExpiration.value) {
    items.sort((a, b) => new Date(a.expiration) - new Date(b.expiration))
  }

  return items
})

// --------------------
// Expiring / Expired Filters
// --------------------
const showExpiringOnly = ref(false)
const showExpiredOnly = ref(false)

// Counts react to filtered list
const expiringSoonCount = computed(() => {
  return filteredItems.value.filter((item) => {
    const days = getDaysUntil(item.expiration)
    return days >= 0 && days <= 5
  }).length
})

const expiredCount = computed(() => {
  return filteredItems.value.filter((item) => getDaysUntil(item.expiration) < 0).length
})

// Toggle logic — only one active at a time
const showAllItems = () => {
  showExpiredOnly.value = false
  showExpiringOnly.value = false
}

const toggleExpiringOnly = () => {
  if (showExpiringOnly.value) {
    showExpiringOnly.value = false
  } else {
    showExpiringOnly.value = true
    showExpiredOnly.value = false
  }
}

const toggleExpiredOnly = () => {
  if (showExpiredOnly.value) {
    showExpiredOnly.value = false
  } else {
    showExpiredOnly.value = true
    showExpiringOnly.value = false
  }
}

// Expiration date calendar when adding new item
const showCalendar = ref(false)

function toggleCalendar() {
  showCalendar.value = !showCalendar.value
}

// calendar for expiration date
const calendarVisible = ref(false)


function handleDateSelect(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  form.value.expiration = `${year}-${month}-${day}` // YYYY-MM-DD in LOCAL time
  calendarVisible.value = false
}



// Master list for the table
const displayedItems = computed(() => {
  if (showExpiringOnly.value) {
    return filteredItems.value.filter((item) => {
      const days = getDaysUntil(item.expiration)
      return days >= 0 && days <= 5
    })
  }
  if (showExpiredOnly.value) {
    return filteredItems.value.filter((item) => getDaysUntil(item.expiration) < 0)
  }
  return filteredItems.value
})

/**
 * confirmClear
 * type: 'total' | 'expired' | 'expiring'
 * Only deletes when corresponding stat view is active.
 * Deletes the currently visible items (displayedItems).
 */

const confirmClear = async (type) => {
  // Ensure correct active state
  if (type === 'total' && (showExpiredOnly.value || showExpiringOnly.value)) {
    await Swal.fire({
      icon: 'info',
      title: 'Select the Total card',
      text: 'Please select the Total card first to clear Total items.',
      confirmButtonColor: '#6b46c1'
    })
    return
  }
  if (type === 'expired' && !showExpiredOnly.value) {
    await Swal.fire({
      icon: 'info',
      title: 'Select the Expired card',
      text: 'Please select the Expired card first to clear Expired items.',
      confirmButtonColor: '#6b46c1'
    })
    return
  }
  if (type === 'expiring' && !showExpiringOnly.value) {
    await Swal.fire({
      icon: 'info',
      title: 'Select the Expiring card',
      text: 'Please select the Expiring card first to clear Expiring items.',
      confirmButtonColor: '#6b46c1'
    })
    return
  }

  const itemsToDelete = displayedItems.value || []
  if (!itemsToDelete.length) {
    await Swal.fire({
      icon: 'info',
      title: 'Nothing to clear',
      text: 'No items to clear in this view.',
      confirmButtonColor: '#6b46c1'
    })
    return
  }

  // SweetAlert2 double confirmation
  const first = await Swal.fire({
    title: `Are you sure?`,
    text: `You are about to delete ${itemsToDelete.length} item(s).`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#ff6b1a',
    cancelButtonColor: '#6b46c1'
  })

  if (!first.isConfirmed) return

  // Delete items by ID
  try {
    const idsToDelete = itemsToDelete.map((i) => i.id)
    const { error } = await supabase
      .from('pantry_items')
      .delete()
      .in('id', idsToDelete)
      .eq('user_id', currentUser.value.id)

    if (error) throw error

    await fetchPantry()
    await Swal.fire({
      icon: 'success',
      title: 'Deleted!',
      text: `${itemsToDelete.length} item(s) have been removed.`,
      confirmButtonColor: '#6b46c1'
    })
  } catch (err) {
    console.error('Error clearing items:', err)
    await Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: 'Failed to clear items: ' + (err.message || err),
      confirmButtonColor: '#6b46c1'
    })
  }
}


// --------------------
// Supabase Operations
// --------------------
const fetchPantry = async () => {
  try {
    const { data, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    pantryData.value = data || []
  } catch (error) {
    console.error('Error fetching pantry:', error)
    alert('Error loading pantry: ' + (error.message || error))
  }
}

const addItem = async () => {
  loading.value = true
  try {
    const payload = {
      user_id: currentUser.value.id,
      name: form.value.name,
      category: form.value.category, // use autofilled category
      quantity: parseFloat(form.value.quantity),
      unit: form.value.unit,
      expiration: form.value.expiration,
    }

    const { error } = await supabase.from("pantry_items").insert([payload])
    if (error) throw error

    closeModal()
    await fetchPantry()
  } catch (error) {
    console.error("Error adding item:", error)
    alert("Failed to add item: " + (error.message || error))
  } finally {
    loading.value = false
  }
}


const startEdit = (item) => {
  editingItem.value = item
  form.value = {
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    expiration: item.expiration
  }
  showAddModal.value = true
}

const updateItem = async () => {
  if (!editingItem.value) return
  loading.value = true
  try {
    const { error } = await supabase
      .from("pantry_items")
      .update({
        name: form.value.name,
        category: form.value.category, // use autofilled category
        quantity: parseFloat(form.value.quantity),
        unit: form.value.unit,
        expiration: form.value.expiration,
      })
      .eq("id", editingItem.value.id)
      .eq("user_id", currentUser.value.id)

    if (error) throw error

    closeModal()
    await fetchPantry()
  } catch (error) {
    console.error("Error updating item:", error)
    alert("Failed to update item: " + (error.message || error))
  } finally {
    loading.value = false
  }
}


const deleteItem = async (id) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'Do you want to delete this item from your pantry?',
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
      .from('pantry_items')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUser.value.id)
    if (error) throw error

    await fetchPantry()

    Swal.fire({
      title: 'Deleted!',
      text: 'The item has been removed from your pantry.',
      icon: 'success',
      confirmButtonColor: '#6b46c1'
    })
  } catch (error) {
    console.error('Error deleting item:', error)
    Swal.fire({
      title: 'Error!',
      text: 'Failed to delete item: ' + (error.message || error),
      icon: 'error',
      confirmButtonColor: '#6b46c1'
    })
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingItem.value = null
  form.value = {
    name: '',
    category: '',
    quantity: '',
    unit: 'pcs',
    expiration: ''
  }
}

const scrollBody = ref(null)

onMounted(() => {
  const header = document.querySelector(".pantry-table-header")
  const body = scrollBody.value

  if (header && body) {
    body.addEventListener("scroll", () => {
      header.scrollLeft = body.scrollLeft
    })
  }
})


// --------------------
// Lifecycle
// --------------------
let pantrySubscription = null

onMounted(async () => {
  try {
    currentUser.value = await getCurrentUser()
    if (!currentUser.value || !currentUser.value.id) {
      router.push('/login')
      return
    }

    await fetchPantry()

    // Set up real-time subscription
    pantrySubscription = supabase
      .channel('pantry_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pantry_items',
          filter: `user_id=eq.${currentUser.value.id}`
        },
        () => {
          fetchPantry()
        }
      )
      .subscribe()
  } catch (error) {
    console.error('Error initializing:', error)
    router.push('/login')
  }
})

onBeforeUnmount(() => {
  try {
    if (pantrySubscription && typeof pantrySubscription.unsubscribe === 'function') {
      pantrySubscription.unsubscribe()
    }
  } catch (e) {
    console.warn('Error unsubscribing:', e)
  }
})
</script>


<style scoped>
.pantry-page {
  min-height: 100vh;
  padding-bottom: 4rem;
  position: relative;
  z-index: 1;
  font-family: "Inter", "Poppins", sans-serif;
}

/* Header */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.pantry-text h1 {
  color: #6b46c1;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.pantry-text p {
  color: #666;
  margin: 0;
}

.btn-add-item {
  background: linear-gradient(135deg, #ff6b1a 0%, #ff9800 100%);
  color: white;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(255, 107, 26, 0.3);
  display: flex;
  align-items: center;
}

/* Search/filter card */
.search-filter-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid #ffd4b3;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-filter-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

.search-box-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #999;
  font-size: 1.1rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.625rem 1rem 0.875rem 3rem;
  border: 2px solid #ffd4b3;
  border-radius: 10px;
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.3s;
  font-family: "Inter", "Poppins", sans-serif;
}

.search-input:focus {
  outline: none;
  border-color: #ff6b1a;
  background: white;
}

.category-filter {
  padding: 0.625rem 1.5rem;
  border: 2px solid #ffd4b3;
  border-radius: 10px;
  font-size: 0.925rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.5);
  min-width: 200px;
  transition: all 0.3s;
  font-family: "Inter", "Poppins", sans-serif;
}

.category-filter:focus {
  outline: none;
  border-color: #ff6b1a;
  background: white;
}

/* Styled checkbox aligned right */
.sort-option {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 1rem;
}

.sort-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #6b46c1;
  cursor: pointer;
  user-select: none;
  font-family: "Inter", "Poppins", sans-serif;
}

.sort-label input[type='checkbox'] {
  appearance: none;
  width: 22px;
  height: 22px;
  border: 2px solid #ffb366;
  border-radius: 6px;
  background: white;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.sort-label input[type='checkbox']:checked {
  background: linear-gradient(135deg, #ff6b1a, #ff9800);
  border-color: #ff6b1a;
}

.sort-label input[type='checkbox']:checked::after {
  content: '✓';
  position: absolute;
  color: white;
  font-size: 0.9rem;
  top: 0.5px;
  left: 4.5px;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-icon.expired {
  color: #dc2626;
}

.stat-value.expired {
  color: #dc2626;
}

.expiring-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.expiring-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
}

.expiring-card.active {
  border-color: #f59e0b;
  background: linear-gradient(135deg, rgba(255, 237, 213, 0.9), rgba(255, 251, 235, 0.9));
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);
}

.stat-icon.expired {
  color: #4c1d95;
}

.stat-value.expired {
  color: #4c1d95;
}

.total-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}
.total-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.25);
}

.expired-card,
.expiring-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.expired-card:hover,
.expiring-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Active states */
.total-card.active {
  border: 2px solid #ff6b1a;
  background: linear-gradient(135deg, rgba(255, 237, 213, 0.95), rgba(255, 251, 235, 0.95));
  box-shadow: 0 0 15px rgba(255, 152, 0, 0.3);
  transform: translateY(-2px);
  transition: all 0.3s ease;
}

.expiring-card.active {
  border-color: #f59e0b;
  background: linear-gradient(135deg, rgba(255, 237, 213, 0.9), rgba(255, 251, 235, 0.9));
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);
}

.expired-card.active {
  border-color: #7c3aed;
  background: linear-gradient(135deg, rgba(237,233,254,0.95), rgba(245,243,255,0.95));
  box-shadow: 0 0 15px rgba(124,58,237,0.3);
}

/* small clear button inside each stat card */
.stat-card {
  position: relative;
  padding-bottom: 3rem; /* make room for the button */
}

.btn-clear-stat {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  border: 1px solid rgba(180,83,9,0.15);
  background: transparent;
  color: #b45309;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-clear-stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(107,70,193,0.08);
  background: rgba(107,70,193,0.04);
}

.total-card .btn-clear-stat {
  color: #c2410c;
  border-color: rgba(194,65,12,0.2);
}
.expired-card .btn-clear-stat {
  color: #5b21b6;
  border-color: rgba(91,33,182,0.2);
}
.expiring-card .btn-clear-stat {
  color: #b45309;
  border-color: rgba(180,83,9,0.2);
}


.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  color: #666;
  font-size: 0.95rem;
}

.stat-icon {
  font-size: 1.5rem;
  color: #ff6b1a;
}

.stat-icon.expiring {
  color: #f59e0b;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
}

.stat-value.expiring {
  color: #f59e0b;
}

/* Table styling */

.pantry-table-container {
  position: relative;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  height: 70vh; /* Fixed window height for table area */
  display: flex;
  flex-direction: column;
}

/* Header stays fixed inside this window */
.pantry-table-header {
  flex-shrink: 0;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #eee;
}

.pantry-table-header table {
  width: 100%;
  border-collapse: collapse;
}

.pantry-table-header th {
  color: #6b46c1;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.85rem;
  padding: 1rem 1.25rem;
  text-align: left;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Scrollable table body below */
.pantry-table-body {
  overflow-y: auto;
  flex-grow: 1;
  background: rgba(255, 255, 255, 0.95);
}

.pantry-table-body table {
  width: 100%;
  border-collapse: collapse;
}

.pantry-table-body td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f7f7f7;
  font-size: 0.95rem;
  color: #1a1a1a;
}

/* Make sure header never shows rows behind it */
.pantry-table-header,
.pantry-table-header th {
  background: white !important;
}

/* Responsive fix — add horizontal scroll & spacing for narrow widths */
@media (max-width: 900px) {
  .pantry-table-body {
    overflow-x: auto;
  }

  .pantry-table-body table {
    min-width: 800px;
  }

  .pantry-table-body td,
  .pantry-table-header th {
    padding: 1rem 1.5rem; /* add extra breathing space */
  }
}

.pantry-table-container {
  position: relative;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 70vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Scroll area allows horizontal scroll for both header + body */
.pantry-table-scroll-area {
  position: relative;
  overflow-x: auto;
}

/* Sticky header inside scroll area */
.pantry-table-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  border-bottom: 1px solid #eee;
}

/* .pantry-table-header table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
} */

.pantry-table-header th {
  color: #6b46c1;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.85rem;
  padding: 1rem 1.25rem;
  text-align: left;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Scrollable body */
.pantry-table-body {
  max-height: 60vh;
  overflow-y: auto;
  overflow-x: auto;
}

.pantry-table-header table,
.pantry-table-body table {
  min-width: 900px; /* ✅ force table wider on narrow viewports */
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.pantry-table-body td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f7f7f7;
  font-size: 0.95rem;
  color: #1a1a1a;
}

/* Responsive horizontal scroll */
@media (max-width: 900px) {
  .pantry-table-scroll-area {
    overflow-x: auto;
  }

  .pantry-table-body table,
  .pantry-table-header table {
    min-width: 900px;
  }
}

/* Match columns of header & body */
.pantry-table-header th,
.pantry-table td {
  width: calc(100% / 7);
}


/* bold + bigger item name */
.name-col {
  font-weight: 700;
  font-size: 1.05rem;
  color: #4a2ea5;
}

/* hover */
.pantry-table-body tr.table-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.04);
}

/* Freshness backgrounds */
.pantry-table-body tr.table-row.fresh {
  background: linear-gradient(90deg, rgba(209,250,229,0.3), transparent);
}

.pantry-table-body tr.table-row.warning {
  background: linear-gradient(90deg, rgba(254,243,199,0.35), transparent);
}

.pantry-table-body tr.table-row.critical {
  background: linear-gradient(90deg, rgba(254,226,226,0.4), transparent);
}

/* expired = solid light red row */
.pantry-table-body tr.table-row.expired {
  background: linear-gradient(90deg, #ede9fe, transparent);
}

/* badges */
.freshness-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  text-align: center;
  line-height: 1.1;
  min-width: 80px;
  white-space: normal;
  word-break: break-word;
}


.freshness-badge.fresh {
  background: #d1fae5;
  color: #065f46;
}

.freshness-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.freshness-badge.critical {
  background: #fee2e2;
  color: #991b1b;
}

.freshness-badge.expired {
  background: #c4b5fd;
  color: #4c1d95;
}

/* Action buttons */
.actions-col {
  width: 120px;
  text-align: right;
}

.btn-edit-table,
.btn-delete-table {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.05rem;
  padding: 0.25rem 0.5rem;
  margin-left: 0.25rem;
}

.btn-edit-table {
  color: #ff6b1a;
}

.btn-edit-table:hover {
  color: #ff9800;
}

.btn-delete-table {
  color: #dc2626;
}

.btn-delete-table:hover {
  color: #a00;
}

/* Modal and form (unchanged) */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.875rem;
  border: 2px solid #f0f0f0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #ff6b1a;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.quantity-row {
  display: flex;
  gap: 0.5rem;
}

.unit-select {
  padding: 0.875rem;
  border: 2px solid #f0f0f0;
  border-radius: 10px;
  cursor: pointer;
  min-width: 100px;
}

.btn-submit {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #ff6b1a 0%, #ff9800 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .pantry-table {
    min-width: 700px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .btn-add-item {
    width: 100%;
    justify-content: center;
  }

  .sort-option {
    justify-content: flex-start;
  }
}

.custom-date-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.custom-date-input {
  width: 100%;
  padding: 0.6rem 2.5rem 0.6rem 0.75rem;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  background-color: #fff;
  color: #1a1a1a;
  font-size: 0.9rem;
  transition: all 0.2s;
  cursor: pointer;
}

.custom-date-input:hover,
.custom-date-input:focus {
  border-color: #ff6b1a;
  box-shadow: 0 0 0 3px rgba(255, 107, 26, 0.15);
}

.calendar-icon {
  position: absolute;
  right: 0.75rem;
  color: #ff6b1a;
  pointer-events: none;
  font-size: 1.1rem;
}

.calendar-dropdown-wrapper {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 0;
  width: 100%;
  z-index: 200;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  transition: all 0.2s ease;
  transform-origin: bottom;
}

.calendar-dropdown-wrapper[style*="display: none"],
.calendar-dropdown-wrapper.hidden {
  opacity: 0;
  transform: translateY(10px);
}




/* Modal Close Button */
.btn-close-modal {
  color: white;
  border: none;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-close-modal:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(255, 107, 26, 0.3);
}

</style>
