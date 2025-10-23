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
              <option v-for="cat in allCategories" :key="cat" :value="cat">
                {{ cat }}
              </option>
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
          <div class="stat-card">
            <div class="stat-header">
              <span>Total Items</span>
              <i class="bi bi-box-seam stat-icon"></i>
            </div>
            <div class="stat-value">{{ filteredItems.length }}</div>
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
          </div>
        </div>

        <!-- Table or Empty -->
        <div v-if="filteredItems.length === 0" class="empty-state">
          <i class="bi bi-basket"></i>
          <h3>Your pantry is empty</h3>
          <p>Start adding ingredients to track your inventory</p>
        </div>

        <div v-else class="pantry-table-wrapper">
          <table class="pantry-table">
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
                  <span
                    :class="['freshness-badge', getFreshnessClass(item.expiration)]"
                  >
                    {{ getFreshnessLabel(item.expiration) }}
                  </span>
                </td>
                <td class="actions-col">
                  <button
                    @click="startEdit(item)"
                    class="btn-edit-table"
                    title="Edit"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    @click="deleteItem(item.id)"
                    class="btn-delete-table"
                    title="Delete"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div v-if="showAddModal || editingItem" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <div>
              <h3>{{ editingItem ? 'Edit Item' : 'Add New Item' }}</h3>
              <p>
                {{
                  editingItem
                    ? 'Update item in your pantry inventory'
                    : 'Add a new item to your pantry inventory'
                }}
              </p>
            </div>
            <button @click="closeModal" class="btn-close-modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form @submit.prevent="editingItem ? updateItem() : addItem()">
            <div class="form-group">
              <label>Item Name</label>
              <input
                type="text"
                v-model="form.name"
                @blur="standardizeName"
                placeholder="e.g., Wheat, Flour"
                required
                class="form-input"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Category</label>
                <div class="category-autocomplete">
                  <input
                    type="text"
                    v-model="form.category"
                    @input="onCategoryInput"
                    @keydown.tab.prevent="applyCategorySuggestion"
                    list="category-suggestions"
                    placeholder="e.g., Dairy, Produce"
                    class="form-input"
                    required
                  />
                  <datalist id="category-suggestions">
                    <option
                      v-for="cat in filteredCategories"
                      :key="cat"
                      :value="cat"
                    />
                  </datalist>
                </div>
              </div>
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
              <label>Expiration Date</label>
              <input
                type="date"
                v-model="form.expiration"
                required
                class="form-input"
              />
            </div>

            <button type="submit" :disabled="loading" class="btn-submit">
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
              ></span>
              {{ editingItem ? 'Update Item' : 'Add to Pantry' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { watch, ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, getCurrentUser } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import { normalizeIngredientName } from '@/utils/IngredientsNormalisation.js'
import { IngredientCategorizer } from '@/utils/IngredientsCategorizer.js'

const router = useRouter()
const loading = ref(false)
const currentUser = ref(null)
const pantryData = ref([])
const editingItem = ref(null)
const showAddModal = ref(false)
const searchQuery = ref('')
const sortByExpiration = ref(false)
const filters = ref({ category: '' })

// ✅ Category auto-complete logic (fixed)
const form = ref({
  name: '',
  category: '',
  quantity: '',
  unit: 'pcs',
  expiration: ''
})

// Get all available categories from categorizer
const allCategories = ref(
  IngredientCategorizer.getCategories
    ? IngredientCategorizer.getCategories()
    : [
        'Dairy', 'Produce', 'Pantry Staples', 'Grains & Bread',
        'Protein', 'Condiments', 'Spices & Herbs', 'Other'
      ]
)

// Dynamic filtered categories for datalist
const filteredCategories = computed(() => {
  const input = form.value.category?.toLowerCase() || ''
  if (!input) return allCategories.value
  return allCategories.value.filter(c => c.toLowerCase().includes(input))
})

// Watch for name changes → auto-fill category once
let userChangedCategory = false

watch(() => form.value.category, () => {
  userChangedCategory = true
})

// --- Auto categorize with normalization ---
watch(() => form.value.name, (newName) => {
  // 🧹 Normalize input
  const normalizedName = normalizeIngredientName(newName)

  // Reset auto-categorization if user cleared or changed significantly
  if (!newName?.trim()) {
    form.value.category = ''
    userChangedCategory = false
    return
  }

  const detected = IngredientCategorizer.categorizeIngredient(normalizedName)
  if (detected && detected !== 'Other') {
    form.value.category = detected
  }  
})

// When user edits the category manually
function onCategoryInput() {
  // Once the user edits the category, stop auto-overwriting
  userChangedCategory = true
}

// If user clears the category box manually, re-enable auto mode
watch(() => form.value.category, (newCat) => {
  if (!newCat?.trim()) userChangedCategory = false
})

function standardizeName() {
  const raw = form.value.name
  if (!raw?.trim()) return
  const trimmed = raw.trim()
  form.value.name = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

function applyCategorySuggestion() {
  const match = allCategories.value.find(c =>
    c.toLowerCase().startsWith(form.value.category.toLowerCase())
  )
  if (match) form.value.category = match
}

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
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
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
      category: form.value.category,
      quantity: parseFloat(form.value.quantity),
      unit: form.value.unit,
      expiration: form.value.expiration
    }
    const { error } = await supabase.from('pantry_items').insert([payload])
    if (error) throw error
    closeModal()
    await fetchPantry()
  } catch (error) {
    console.error('Error adding item:', error)
    alert('Failed to add item: ' + (error.message || error))
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
      .from('pantry_items')
      .update({
        name: form.value.name,
        category: form.value.category,
        quantity: parseFloat(form.value.quantity),
        unit: form.value.unit,
        expiration: form.value.expiration
      })
      .eq('id', editingItem.value.id)
      .eq('user_id', currentUser.value.id)

    if (error) throw error
    closeModal()
    await fetchPantry()
  } catch (error) {
    console.error('Error updating item:', error)
    alert('Failed to update item: ' + (error.message || error))
  } finally {
    loading.value = false
  }
}

const deleteItem = async (id) => {
  if (!confirm('Delete this item?')) return
  try {
    const { error } = await supabase
      .from('pantry_items')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUser.value.id)
    if (error) throw error
    await fetchPantry()
  } catch (error) {
    console.error('Error deleting item:', error)
    alert('Delete failed: ' + (error.message || error))
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
  color: #dc2626;
}

.stat-value.expired {
  color: #dc2626;
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
.expiring-card.active {
  border-color: #f59e0b;
  background: linear-gradient(135deg, rgba(255, 237, 213, 0.9), rgba(255, 251, 235, 0.9));
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);
}

.expired-card.active {
  border-color: #dc2626;
  background: linear-gradient(135deg, rgba(254, 226, 226, 0.95), rgba(255, 241, 241, 0.95));
  box-shadow: 0 0 15px rgba(220, 38, 38, 0.3);
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
.pantry-table-wrapper {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  overflow: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 0.5rem;
}

.pantry-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
  font-family: "Inter", "Poppins", sans-serif;
}

.pantry-table thead th {
  position: sticky;
  top: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.95), white);
  color: #6b46c1;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.85rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  text-align: left;
}

.pantry-table tbody td {
  padding: 1rem 1rem;
  border-bottom: 1px solid #f7f7f7;
  font-size: 0.95rem;
  color: #1a1a1a;
  transition: background 0.2s;
}

/* bold + bigger item name */
.name-col {
  font-weight: 700;
  font-size: 1.05rem;
  color: #4a2ea5;
}

/* alternating rows */
.pantry-table tbody tr.table-row:nth-child(odd) {
  background: rgba(255,255,255,0.95);
}

/* hover */
.pantry-table tbody tr.table-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.04);
}

/* Freshness backgrounds */
.pantry-table tbody tr.table-row.fresh {
  background: linear-gradient(90deg, rgba(209,250,229,0.3), transparent);
}

.pantry-table tbody tr.table-row.warning {
  background: linear-gradient(90deg, rgba(254,243,199,0.35), transparent);
}

.pantry-table tbody tr.table-row.critical {
  background: linear-gradient(90deg, rgba(254,226,226,0.4), transparent);
}

/* expired = solid light red row */
.table-row.expired {
  background: #fde8e8 !important;
}

/* badges */
.freshness-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
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
  background: #fca5a5;
  color: #7f1d1d;
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
</style>
