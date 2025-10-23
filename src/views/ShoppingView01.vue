<template>
  <div class="shopping-view container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="fw-bold text-primary">
            <i class="bi bi-cart3"></i>
            Shopping List
      </h1>
      
      <!-- Sorting Dropdown -->
      <div class="d-flex align-items-center gap-2">
        <label class="fw-semibold me-1">Sort by:</label>
        <select v-model="sortMode" class="form-select form-select-sm w-auto">
          <option value="category">Category</option>
          <option value="alphabet">A–Z</option>
        </select>
      </div>
    </div>

    <!-- No items -->
    <div v-if="!items.length" class="text-center text-muted py-5">
    <i class="bi bi-cart-x display-4 d-block mb-2"></i>
    <p>Your shopping list is empty. Add some meals to get started!</p>
    </div>

    <!-- Shopping List -->
    <div v-else class="shopping-list">
      <!-- When sorted by category -->
      <div v-if="sortMode === 'category'">
        <div
          v-for="(items, category) in sortedCategories"
          :key="category"
          class="category-card mb-3 shadow-sm"
        >
          <div
            class="category-header d-flex justify-content-between align-items-center p-3"
            :class="{ collapsed: !expandedCategories[category] }"
            @click="toggleCategory(category)"
          >
            <div>
              <i class="bi me-2" :class="getCategoryIcon(category)"></i>
              <strong>{{ category }}</strong>
            </div>
            <i
              class="bi"
              :class="expandedCategories[category] ? 'bi-chevron-up' : 'bi-chevron-down'"
            ></i>
          </div>

          <transition name="fade">
            <ul
              v-if="expandedCategories[category]"
              class="list-group list-group-flush"
            >
              <li
                v-for="item in items"
                :key="item.id"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <input
                    type="checkbox"
                    v-model="item.purchased"
                    @change="togglePurchased(item)"
                    class="form-check-input me-2"
                  />
                  {{ capitalize(item.name) }}
                </div>
                <small class="text-muted">
                  {{ item.quantity }} {{ item.unit }}
                </small>
              </li>
            </ul>
          </transition>
        </div>
      </div>

      <!-- When sorted alphabetically -->
      <div v-else>
        <ul class="list-group shadow-sm">
          <li
            v-for="item in alphabeticallySorted"
            :key="item.id"
            class="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <input
                type="checkbox"
                v-model="item.purchased"
                @change="togglePurchased(item)"
                class="form-check-input me-2"
              />
              {{ capitalize(item.name) }}
              <small class="text-muted ms-2">({{ item.category }})</small>
            </div>
            <small class="text-muted">
              {{ item.quantity }} {{ item.unit }}
            </small>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase, getCurrentUser } from '@/lib/supabase'

const currentUser = ref(null)
const items = ref([])
const sortMode = ref('category')
const expandedCategories = ref({}) // track open/closed state

// Fetch items from Supabase
async function fetchShoppingItems() {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('user_id', currentUser.value.id)
    .eq('purchased', false)

  if (error) {
    console.error('Error fetching items:', error)
  } else {
    items.value = data || []

    // Initialize all categories as closed
    const uniqueCategories = [...new Set(items.value.map(i => i.category || 'Other'))]
    expandedCategories.value = Object.fromEntries(uniqueCategories.map(c => [c, false]))
  }
}

// Toggle category open/close
function toggleCategory(category) {
  expandedCategories.value[category] = !expandedCategories.value[category]
}

// Toggle purchased state
async function togglePurchased(item) {
  const { error } = await supabase
    .from('shopping_items')
    .update({ purchased: item.purchased })
    .eq('id', item.id)
  if (error) console.error('Error updating purchased:', error)
}

// Computed: Group by category
const groupedByCategory = computed(() => {
  const grouped = {}
  items.value.forEach(i => {
    const cat = i.category || 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(i)
  })
  return grouped
})

// Computed: Sorted categories (Other always last)
const sortedCategories = computed(() => {
  const entries = Object.entries(groupedByCategory.value)
  entries.sort((a, b) => {
    if (a[0] === 'Other') return 1
    if (b[0] === 'Other') return -1
    return a[0].localeCompare(b[0])
  })
  return Object.fromEntries(entries)
})

// Computed: Alphabetically sorted list
const alphabeticallySorted = computed(() =>
  [...items.value].sort((a, b) => a.name.localeCompare(b.name))
)

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Category icons
function getCategoryIcon(category) {
  const icons = {
    Produce: 'bi-basket2-fill text-success',
    Proteins: 'bi-egg-fried text-danger',
    Dairy: 'bi-cup-straw text-primary',
    'Grains & Bread': 'bi-bag-fill text-warning',
    'Pantry Staples': 'bi-box-seam text-info',
    'Spices & Herbs': 'bi-leaf-fill text-success',
    'Canned & Jarred': 'bi-box2-fill text-secondary',
    Beverages: 'bi-cup-hot text-danger',
    Snacks: 'bi-cookie text-warning',
    Other: 'bi-question-circle text-muted'
  }
  return icons[category] || 'bi-question-circle'
}

onMounted(async () => {
  currentUser.value = await getCurrentUser()
  await fetchShoppingItems()
})
</script>

<style scoped>
.shopping-view {
  min-height: 100vh;
  padding-bottom: 4rem;
}

/* Category Cards */
.category-card {
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}
.category-header {
  cursor: pointer;
  font-weight: 600;
  background: #f7f8fa;
  transition: background 0.2s ease;
}
.category-header:hover {
  background: #eef2f5;
}

/* Collapsed Indicator */
.category-header.collapsed {
  opacity: 0.8;
}

/* Fade animation */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Checkboxes */
.form-check-input {
  cursor: pointer;
}
</style>
