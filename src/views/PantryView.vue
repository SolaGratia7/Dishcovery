<template>
  <AppLayout>
    <div class="pantry-page">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="container text-center">
          <h1 class="hero-title">My Pantry</h1>
          <p class="hero-subtitle">Track your ingredients and never waste food again</p>
        </div>
      </div>

      <div class="container my-5">
        <div class="row g-4">
          <!-- Add/Edit Ingredient Card -->
          <div class="col-lg-4">
            <div class="add-card sticky-card">
              <div class="add-header">
                <i :class="editingItem ? 'bi bi-pencil-square' : 'bi bi-plus-circle'"></i>
                <h3>{{ editingItem ? 'Edit' : 'Add' }} Ingredient</h3>
              </div>

              <form @submit.prevent="editingItem ? updateItem() : addItem()">
                <!-- Ingredient Name -->
                <div class="form-group">
                  <label>
                    <i class="bi bi-egg me-2"></i>
                    Ingredient Name
                  </label>
                  <input 
                    type="text" 
                    class="form-input" 
                    v-model="form.name"
                    placeholder="e.g., Chicken Breast"
                    required
                  >
                </div>

                <!-- Category -->
                <div class="form-group">
                  <label>
                    <i class="bi bi-grid-3x3-gap me-2"></i>
                    Category
                  </label>
                  <select v-model="form.category" class="form-select-custom" required>
                    <option value="">Choose category...</option>
                    <option v-for="cat in categories" :key="cat" :value="cat">
                      {{ cat }}
                    </option>
                  </select>
                </div>

                <!-- Quantity -->
                <div class="form-group">
                  <label>
                    <i class="bi bi-123 me-2"></i>
                    Quantity
                  </label>
                  <input 
                    type="number" 
                    class="form-input" 
                    v-model="form.quantity"
                    min="0" 
                    step="any"
                    placeholder="e.g., 500"
                    required
                  >
                </div>

                <!-- Unit Buttons -->
                <div class="form-group">
                    <label>
                        <i class="bi bi-rulers me-2"></i>
                        Unit
                    </label>
                    <div class="unit-buttons">
                        <button 
                        type="button"
                        :class="['unit-btn', { active: form.unit === 'pcs' }]"
                        @click="form.unit = 'pcs'"
                        >
                        <i class="bi bi-box"></i>
                        Pieces
                        </button>
                        <button 
                        type="button"
                        :class="['unit-btn', { active: form.unit === 'grams' }]"
                        @click="form.unit = 'grams'"
                        >
                        <i class="bi bi-speedometer2"></i>
                        Grams
                        </button>
                        <button 
                        type="button"
                        :class="['unit-btn', { active: form.unit === 'ml' }]"
                        @click="form.unit = 'ml'"
                        >
                        <i class="bi bi-droplet"></i>
                        ML
                        </button>
                    </div>
                </div>

                <!-- Expiration Date -->
                <div class="form-group">
                  <label>
                    <i class="bi bi-calendar-event me-2"></i>
                    Expiration Date
                  </label>
                  <input 
                    type="date" 
                    class="form-input" 
                    v-model="form.expiration"
                    required
                  >
                </div>

                <!-- Submit Buttons -->
                <div class="button-group">
                  <button 
                    v-if="editingItem"
                    type="button"
                    @click="cancelEdit"
                    class="btn-secondary-custom"
                  >
                    <i class="bi bi-x-circle me-2"></i>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    :disabled="loading"
                    class="btn-primary-custom"
                  >
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else :class="editingItem ? 'bi bi-check-circle me-2' : 'bi bi-plus-circle me-2'"></i>
                    {{ editingItem ? 'Update' : 'Add to Pantry' }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Pantry Items List -->
          <div class="col-lg-8">
            <!-- Filter Bar -->
            <div class="filter-card">
              <div class="filter-header">
                <i class="bi bi-funnel"></i>
                <h4>Filter & Sort</h4>
              </div>
              <div class="filter-grid">
                <div class="filter-item">
                  <label>Category</label>
                  <select v-model="filters.category" class="form-select-filter">
                    <option value="">All Categories</option>
                    <option v-for="cat in categories" :key="cat" :value="cat">
                      {{ cat }}
                    </option>
                  </select>
                </div>

                <div class="filter-item">
                  <label>Sort by Expiration</label>
                  <select v-model="filters.sortExpiration" class="form-select-filter">
                    <option value="none">None</option>
                    <option value="asc">Earliest to Latest</option>
                    <option value="desc">Latest to Earliest</option>
                  </select>
                </div>

                <div class="filter-item">
                  <button @click="applyFilters" class="btn-filter">
                    <i class="bi bi-arrow-clockwise me-2"></i>
                    Apply
                  </button>
                </div>
              </div>
            </div>

            <!-- Items Count -->
            <div v-if="displayedItems.length > 0" class="items-count">
              <i class="bi bi-box-seam me-2"></i>
              {{ displayedItems.length }} item{{ displayedItems.length !== 1 ? 's' : '' }} in pantry
            </div>

            <!-- Empty State -->
            <div v-if="displayedItems.length === 0" class="empty-state">
              <div class="empty-icon">
                <i class="bi bi-basket"></i>
              </div>
              <h3>Your Pantry is Empty</h3>
              <p>Start adding ingredients to track your inventory!</p>
            </div>

            <!-- Pantry Items Grid -->
            <div v-else class="pantry-grid">
              <div 
                v-for="item in displayedItems" 
                :key="item.id"
                :class="['pantry-item', getExpiryClass(item.expiration)]"
              >
                <div class="item-header">
                  <div class="item-category-badge">
                    {{ item.category }}
                  </div>
                  <div class="item-actions">
                    <button 
                      @click="startEdit(item)"
                      class="action-btn edit-btn"
                      title="Edit"
                    >
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button 
                      @click="deleteItem(item.id)"
                      class="action-btn delete-btn"
                      title="Delete"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>

                <div class="item-body">
                  <h5 class="item-name">{{ item.name }}</h5>
                  <div class="item-quantity">
                    <i class="bi bi-box"></i>
                    <span>{{ item.quantity }} {{ item.unit }}</span>
                  </div>
                </div>

                <div class="item-footer">
                  <div class="expiry-info">
                    <i class="bi bi-calendar-x"></i>
                    <span>{{ getExpiryText(item.expiration) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, getCurrentUser } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout.vue'

const router = useRouter()
const loading = ref(false)
const currentUser = ref(null)
const pantryData = ref([])
const displayedItems = ref([])
const editingItem = ref(null)

const categories = [
  'Vegetables', 'Dairy', 'Carbohydrates', 'Protein', 
  'Fruits', 'Snacks', 'Condiments', 'Beverages', 
  'Frozen Foods', 'Canned Goods'
]

const form = ref({
  name: '',
  category: '',
  quantity: '',
  unit: 'pcs',
  expiration: ''
})

const filters = ref({
  category: '',
  sortExpiration: 'none'
})

// Helper functions
const startOfDay = (d) => {
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  return dt
}

const getDaysUntil = (dateStr) => {
  const today = startOfDay(new Date())
  const exp = startOfDay(new Date(dateStr))
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.ceil((exp - today) / msPerDay)
}

const getExpiryClass = (dateStr) => {
  const days = getDaysUntil(dateStr)
  if (days < 0) return 'expired'
  if (days < 3) return 'expiring-critical'
  if (days < 7) return 'expiring-warning'
  return 'normal'
}

const getExpiryText = (dateStr) => {
  const days = getDaysUntil(dateStr)
  if (days < 0) return `Expired ${days * -1} days ago`
  if (days === 0) return `Expires today`
  return `Expires in ${days} days`
}

// Fetch pantry items
const fetchPantry = async () => {
  try {
    const { data, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    pantryData.value = data || []
    displayedItems.value = [...pantryData.value]
  } catch (error) {
    console.error('Error fetching pantry:', error)
    alert('Error loading pantry: ' + error.message)
  }
}

// Add new item
const addItem = async () => {
  loading.value = true
  
  try {
    const { error } = await supabase
      .from('pantry_items')
      .insert([{
        user_id: currentUser.value.id,
        name: form.value.name,
        category: form.value.category,
        quantity: parseFloat(form.value.quantity),
        unit: form.value.unit,
        expiration: form.value.expiration
      }])

    if (error) throw error

    // Reset form
    form.value = {
      name: '',
      category: '',
      quantity: '',
      unit: 'pcs',
      expiration: ''
    }

    await fetchPantry()
  } catch (error) {
    console.error('Error adding item:', error)
    alert('Failed to add item: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Start editing
const startEdit = (item) => {
  editingItem.value = item
  form.value = {
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    expiration: item.expiration
  }
  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Update item
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

    alert('Item updated successfully!')
    cancelEdit()
    await fetchPantry()
  } catch (error) {
    console.error('Error updating item:', error)
    alert('Failed to update item: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Cancel edit
const cancelEdit = () => {
  editingItem.value = null
  form.value = {
    name: '',
    category: '',
    quantity: '',
    unit: 'pcs',
    expiration: ''
  }
}

// Delete item
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
    alert('Delete failed: ' + error.message)
  }
}

// Apply filters
const applyFilters = () => {
  let filtered = [...pantryData.value]

  if (filters.value.category) {
    filtered = filtered.filter(item => item.category === filters.value.category)
  }

  if (filters.value.sortExpiration === 'asc') {
    filtered.sort((a, b) => new Date(a.expiration) - new Date(b.expiration))
  } else if (filters.value.sortExpiration === 'desc') {
    filtered.sort((a, b) => new Date(b.expiration) - new Date(a.expiration))
  }

  displayedItems.value = filtered
}

// Initialize
onMounted(async () => {
  try {
    currentUser.value = await getCurrentUser()
    await fetchPantry()

    // Set up real-time subscription
    const subscription = supabase
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

    return () => {
      subscription.unsubscribe()
    }
  } catch (error) {
    console.error('Error initializing:', error)
    router.push('/login')
  }
})
</script>

<style scoped>
.pantry-page {
  background: linear-gradient(to bottom, #faf8f5 0%, #f5f5f5 100%);
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d5c4 50%, #d4a574 100%);
  padding: 4rem 2rem;
  margin-bottom: 3rem;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.3;
}

.hero-title {
  color: #8b6f47;
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
}

.hero-subtitle {
  color: #6b5d52;
  font-size: 1.25rem;
  margin: 0;
  position: relative;
  z-index: 1;
}

/* Add/Edit Card */
.sticky-card {
  position: sticky;
  top: 100px;
}

.add-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(139, 111, 71, 0.1);
}

.add-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0e8dc;
}

.add-header i {
  font-size: 2rem;
  color: #c89960;
}

.add-header h3 {
  color: #8b6f47;
  font-weight: 700;
  margin: 0;
  font-size: 1.5rem;
}

/* Form Styles */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  color: #6b5d52;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.form-input,
.form-select-custom {
  width: 100%;
  padding: 0.875rem;
  border: 2px solid #e8d7c3;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s;
  background: white;
}

.form-input:focus,
.form-select-custom:focus {
  outline: none;
  border-color: #c89960;
  box-shadow: 0 0 0 4px rgba(200, 153, 96, 0.1);
}

.form-select-custom {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23c89960' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

/* Unit Buttons - Update for 3 columns */
/* Unit Buttons - 3 equal columns */
.unit-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  width: 100%;
}

.unit-btn {
  padding: 1rem 0.5rem;
  border: 2px solid #e8d7c3;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #6b5d52;
  width: 100%;
  min-height: 90px;
  font-size: 0.9rem;
}

.unit-btn i {
  font-size: 1.5rem;
}

.unit-btn:hover {
  border-color: #c89960;
  background: #faf8f5;
}

.unit-btn.active {
  border-color: #c89960;
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d7c3 100%);
  color: #8b6f47;
}

@media (max-width: 576px) {
  .unit-buttons {
    grid-template-columns: 1fr;
  }
  
  .unit-btn {
    min-height: 70px;
  }
}

/* Button Group */
.button-group {
  display: flex;
  gap: 0.75rem;
  margin-top: 2rem;
}

.btn-primary-custom {
  flex: 1;
  padding: 1rem;
  background: linear-gradient(135deg, #d4a574 0%, #c89960 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(200, 153, 96, 0.3);
}

.btn-primary-custom:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(200, 153, 96, 0.4);
}

.btn-primary-custom:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary-custom {
  padding: 1rem 1.5rem;
  background: #f0e8dc;
  color: #8b6f47;
  border: 2px solid #e8d7c3;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary-custom:hover {
  background: #e8d7c3;
}

/* Filter Card */
.filter-card {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.filter-header i {
  color: #c89960;
  font-size: 1.25rem;
}

.filter-header h4 {
  color: #8b6f47;
  font-weight: 600;
  margin: 0;
  font-size: 1.1rem;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
  align-items: end;
}

.filter-item label {
  display: block;
  color: #6b5d52;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.form-select-filter {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e8d7c3;
  border-radius: 10px;
  font-size: 0.95rem;
  cursor: pointer;
  background: white;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23c89960' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem;
}

.btn-filter {
  padding: 0.75rem 1.5rem;
  background: #c89960;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-filter:hover {
  background: #b8895a;
  transform: translateY(-2px);
}

/* Items Count */
.items-count {
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d7c3 100%);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  color: #8b6f47;
  font-weight: 600;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 5rem 2rem;
  background: white;
  border-radius: 20px;
}

.empty-icon {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d7c3 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
}

.empty-icon i {
  font-size: 4rem;
  color: #c89960;
}

.empty-state h3 {
  color: #8b6f47;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #999;
  font-size: 1.1rem;
}

/* Pantry Grid */
.pantry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.pantry-item {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  transition: all 0.3s;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.pantry-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(139, 111, 71, 0.15);
}

/* Expiry Colors */
.pantry-item.normal {
  border-color: #e8d7c3;
}

.pantry-item.expiring-warning {
  border-color: #f4c430;
  background: #fffbf0;
}

.pantry-item.expiring-critical {
  border-color: #ff9966;
  background: #fff5f0;
}

.pantry-item.expired {
  border-color: #dc3545;
  background: #fff0f0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.item-category-badge {
  background: linear-gradient(135deg, #d4a574 0%, #c89960 100%);
  color: white;
  padding: 0.4rem 0.875rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.edit-btn {
  background: #e8f4ff;
  color: #0066cc;
}

.edit-btn:hover {
  background: #0066cc;
  color: white;
}

.delete-btn {
  background: #ffe8e8;
  color: #dc3545;
}

.delete-btn:hover {
  background: #dc3545;
  color: white;
}

.item-body {
  margin-bottom: 1rem;
}

.item-name {
  color: #333;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.item-quantity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 1rem;
  font-weight: 600;
}

.item-quantity i {
  color: #c89960;
  font-size: 1.1rem;
}

.item-footer {
  padding-top: 1rem;
  border-top: 1px solid #f0e8dc;
}

.expiry-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.expiry-info i {
  color: #c89960;
}

.expired .expiry-info {
  color: #dc3545;
  font-weight: 600;
}

.expiring-critical .expiry-info {
  color: #ff6600;
  font-weight: 600;
}

.expiring-warning .expiry-info {
  color: #cc8800;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 992px) {
  .sticky-card {
    position: static;
  }
  
  .filter-grid {
    grid-template-columns: 1fr;
  }
  
  .btn-filter {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .add-card {
    padding: 1.5rem;
  }
  
  .pantry-grid {
    grid-template-columns: 1fr;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .btn-secondary-custom {
    width: 100%;
  }
}
</style>