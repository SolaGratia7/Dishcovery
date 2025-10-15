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
        <!-- Search and Filter Bar -->
        <div class="search-filter-card">
            <div class="search-filter-content">
                <div class="search-box-wrapper">
                    <i class="bi bi-search search-icon"></i>
                    <input 
                        type="text" 
                        v-model="searchQuery"
                        placeholder="Search items..."
                        class="search-input"
                    >
                </div>
                
                <select v-model="filters.category" class="category-filter">
                    <option value="">All Categories</option>
                    <option v-for="cat in categories" :key="cat" :value="cat">
                        {{ cat }}
                    </option>
                </select>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <span>Total Items</span>
              <i class="bi bi-box-seam stat-icon"></i>
            </div>
            <div class="stat-value">{{ pantryData.length }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span>Expiring Soon</span>
              <i class="bi bi-calendar-x stat-icon expiring"></i>
            </div>
            <div class="stat-value expiring">{{ getExpiringSoonCount() }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span>Categories</span>
              <i class="bi bi-grid-3x3-gap stat-icon categories"></i>
            </div>
            <div class="stat-value categories">{{ getUniqueCategoriesCount() }}</div>
          </div>
        </div>

        <!-- Pantry Items Grid -->
        <div v-if="filteredItems.length === 0" class="empty-state">
          <i class="bi bi-basket"></i>
          <h3>Your pantry is empty</h3>
          <p>Start adding ingredients to track your inventory</p>
        </div>

        <div v-else class="items-grid">
          <div v-for="item in filteredItems" :key="item.id" class="item-card">
            <div class="item-card-header">
              <div>
                <h5 class="item-name">{{ item.name }}</h5>
                <span class="item-category">{{ item.category }}</span>
              </div>
              <span :class="['freshness-badge', getFreshnessClass(item.expiration)]">
                {{ getFreshnessLabel(item.expiration) }}
              </span>
            </div>

            <div class="item-details">
              <div class="detail-row">
                <span class="detail-label">Quantity:</span>
                <span class="detail-value">{{ item.quantity }} {{ item.unit }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Expires:</span>
                <span class="detail-value">{{ formatDate(item.expiration) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Added:</span>
                <span class="detail-value">{{ formatDate(item.created_at) }}</span>
              </div>
            </div>

            <div class="item-actions">
              <button @click="startEdit(item)" class="btn-edit">
                <i class="bi bi-pencil me-1"></i>
                Edit
              </button>
              <button @click="deleteItem(item.id)" class="btn-delete">
                <i class="bi bi-trash"></i>
              </button>
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
            <div class="form-group">
              <label>Item Name</label>
              <input 
                type="text" 
                v-model="form.name"
                placeholder="e.g., Whole Wheat Flour"
                required
                class="form-input"
              >
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Category</label>
                <select v-model="form.category" required class="form-input">
                  <option value="">Select category</option>
                  <option v-for="cat in categories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
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
                  >
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
              >
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, getCurrentUser } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'

const router = useRouter()
const loading = ref(false)
const currentUser = ref(null)
const pantryData = ref([])
const editingItem = ref(null)
const showAddModal = ref(false)
const searchQuery = ref('')

const categories = [
  'Vegetables', 'Dairy', 'Carbohydrates', 'Protein', 
  'Fruits', 'Snacks', 'Condiments', 'Beverages', 
  'Frozen Foods', 'Canned Goods', 'Grains', 'Oils'
]

const form = ref({
  name: '',
  category: '',
  quantity: '',
  unit: 'pcs',
  expiration: ''
})

const filters = ref({
  category: ''
})

// Computed filtered items
const filteredItems = computed(() => {
  let items = [...pantryData.value]
  
  if (searchQuery.value) {
    items = items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  if (filters.value.category) {
    items = items.filter(item => item.category === filters.value.category)
  }
  
  return items
})

// Helper functions
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
  if (days <= 3) return 'critical'
  if (days <= 7) return 'warning'
  return 'fresh'
}

const getFreshnessLabel = (dateStr) => {
  const days = getDaysUntil(dateStr)
  if (days < 0) return 'Expired'
  if (days <= 3) return 'Use Soon'
  if (days <= 7) return 'Expiring'
  return 'Fresh'
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
}

const getExpiringSoonCount = () => {
  return pantryData.value.filter(item => {
    const days = getDaysUntil(item.expiration)
    return days >= 0 && days <= 7
  }).length
}

const getUniqueCategoriesCount = () => {
  const uniqueCategories = new Set(pantryData.value.map(item => item.category))
  return uniqueCategories.size
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

    closeModal()
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

    closeModal()
    await fetchPantry()
  } catch (error) {
    console.error('Error updating item:', error)
    alert('Failed to update item: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Close modal
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
  min-height: 100vh;
  padding-bottom: 4rem;
  position: relative;
  z-index: 1;
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

.btn-add-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 26, 0.4);
}

/* Search and Filter Card */
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
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .search-filter-content {
    flex-direction: row;
  }
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
}

.category-filter:focus {
  outline: none;
  border-color: #ff6b1a;
  background: white;
}

@media (max-width: 767px) {
  .category-filter {
    width: 100%;
  }
}

/* Stats Cards */
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

.stat-icon.categories {
  color: #8b5cf6;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
}

.stat-value.expiring {
  color: #f59e0b;
}

.stat-value.categories {
  color: #8b5cf6;
}

/* Items Grid */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.item-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.item-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.item-name {
  color: #6b46c1;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.item-category {
  color: #666;
  font-size: 0.85rem;
}

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

.item-details {
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.detail-label {
  color: #666;
  font-size: 0.9rem;
}

.detail-value {
  color: #1a1a1a;
  font-weight: 600;
  font-size: 0.9rem;
}

.item-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-edit {
  flex: 1;
  padding: 0.625rem;
  background: white;
  color: #ff6b1a;
  border: 2px solid #ff6b1a;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-edit:hover {
  background: #ff6b1a;
  color: white;
}

.btn-delete {
  padding: 0.625rem 1rem;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-delete:hover {
  background: #dc2626;
  color: white;
}

/* Modal */
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

.modal-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.modal-header p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.btn-close-modal {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  color: #666;
}

.btn-close-modal:hover {
  color: #1a1a1a;
}

/* Form */
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

.quantity-row .form-input {
  flex: 1;
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

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 26, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 5rem 2rem;
  background: white;
  border-radius: 16px;
}

.empty-state i {
  font-size: 5rem;
  color: #ddd;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .btn-add-item {
    width: 100%;
    justify-content: center;
  }
  
  .search-filter-bar {
    flex-direction: column;
  }
  
  .category-filter {
    width: 100%;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>