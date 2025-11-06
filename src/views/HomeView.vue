<template>
  <AppLayout>
    <AnimatedBackground />

    <div class="home-view" :class="{ 'content-visible': showContent }">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <div class="animate-fade-in">
            <div class="mx-auto mb-3">
              <svg xmlns="http://www.w3.org/200 0/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#6b46c1" stroke-width="2">
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
                <line x1="6" y1="17" x2="18" y2="17"/>
              </svg>
            </div>
            <h1 class="hero-title">
              Welcome to Your Kitchen
            </h1>
            <p class="hero-subtitle">
              Discover recipes, track ingredients, and plan meals effortlessly
            </p>
          </div>
        </div>
      </section>

      <!-- Main Content Grid -->
      <div class="container">
        <div class="content-grid stagger-item" style="--stagger: 0">
          <!-- Left Column: Pantry Carousel -->
          <div class="pantry-carousel-wrapper stagger-item">
            <!-- Loading State -->
            <div v-if="loadingPopularRecipes"
                id="pantryCarousel"
                class="carousel slide carousel-loading"
                data-bs-ride="carousel"
                data-bs-interval="3000">
              <div class="spinner-border text-primary"></div>
              <p>Loading featured recipes...</p>
            </div>

            <!-- Bootstrap Carousel -->
            <div v-else
                id="pantryCarousel"
                class="carousel slide"
                data-bs-ride="carousel"
                data-bs-interval="3000">
              <div class="carousel-indicators">
                <button
                  v-for="(img, index) in pantryImages"
                  :key="index"
                  type="button"
                  data-bs-target="#pantryCarousel"
                  :data-bs-slide-to="index"
                  :class="{ active: index === 0 }"
                  :aria-label="`Slide ${index + 1}`"
                ></button>
              </div>

              <div class="carousel-inner">
                <div
                  v-for="(img, index) in pantryImages"
                  :key="index"
                  :class="['carousel-item', { active: index === 0 }]"
                >
                  <div class="carousel-item-wrapper" @click="showRecipeDetails(img)">
                    <img
                      :src="img.image"
                      :alt="img.title"
                      class="carousel-image"
                    />
                     <button
                      v-if="img.recipe"
                      class="favourite-btn"
                      :class="{ favourited: isRecipeSaved(img.recipe.id) }"
                      @click.stop="toggleFavourite(img.recipe)"
                    >
                      <i class="bi" :class="isRecipeSaved(img.recipe.id) ? 'bi-heart-fill text-danger' : 'bi-heart'"></i>
                    </button>

                    <div class="carousel-caption-custom">
                      <h4>{{ img.title }}</h4>
                      <p>
                        <i class="bi bi-heart-fill text-danger"></i> {{ img.recipe?.aggregateLikes || 0 }} likes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <RecipeModal
                :recipe="selectedCarouselRecipe"
                @close="selectedCarouselRecipe = null"
              />

              <button
                class="carousel-control-prev"
                type="button"
                data-bs-target="#pantryCarousel"
                data-bs-slide="prev"
                aria-label="Previous slide"
              >
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
              </button>
              <button
                class="carousel-control-next"
                type="button"
                data-bs-target="#pantryCarousel"
                data-bs-slide="next"
                aria-label="Next slide"
              >
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
              </button>
            </div>
          </div>

          <!-- Right Column: Expiring Items & Quick Actions -->
          <div class="right-column stagger-item" style="--stagger: 1">
            <div class="expiring-container">
              <!-- Expiring Items Card -->
              <div class="expiring-card">
                <div class="alert-header">
                  <i class="bi bi-exclamation-triangle-fill"></i>
                  <div>
                    <h3>Items Expiring Soon</h3>
                    <p>Take action on these items to avoid waste</p>
                  </div>
                </div>

                <div class="card-body">
                  <!-- Scrollable list wrapper -->
                  <div class="expiring-scroll-wrapper">
                    <div v-if="expiringItems.length === 0" class="no-items">
                      <i class="bi bi-check-circle-fill"></i>
                      <p>All items are fresh!</p>
                    </div>

                    <div v-else class="expiring-list">
                      <div
                        v-for="item in expiringItems"
                        :key="item.id"
                        class="expiring-item"
                      >
                        <div class="item-icon">
                          <i class="bi bi-calendar-event"></i>
                        </div>
                        <div class="item-details">
                          <strong>{{ item.name }}</strong>
                          <span class="item-category">{{ item.category }}</span>
                        </div>
                        <span :class="['badge', getExpirySeverityClass(item.daysLeft)]">
                          {{ item.daysLeft }} days left
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Fixed Bottom Button -->
                  <div class="expiring-button-wrapper">
                    <button
                      @click="findRecipesWithExpiringItems"
                      class="btn btn-danger w-100"
                      :disabled="expiringItems.length === 0"
                    >
                      <i class="bi bi-search me-2"></i>
                      Find Recipes with These Ingredients!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Saved Recipes Section -->
        <section class="saved-recipes-section stagger-item" style="--stagger: 1">
          <div class="section-header sticky-header">
            <div>
              <h2><i class="bi bi-bookmark-heart me-2"></i>Your Saved Recipes</h2>
              <p class="text-muted-foreground mt-2">
                {{ isSwipeMode ? "Swipe through your delicious collection" : "Scroll through your recipe grid" }}
              </p>
            </div>

            <!-- View Mode Toggle -->
            <div class="view-mode-toggle">
              <label class="toggle-label">
                {{ isSwipeMode ? "Swipe Mode" : "Grid Mode" }}
              </label>
              <button
                @click="toggleViewMode"
                class="toggle-switch"
                :class="{ 'active': isSwipeMode }"
                role="switch"
                :aria-checked="isSwipeMode"
              >
                <span class="toggle-slider"></span>
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loadingSavedRecipes" class="text-center py-12">
            <div class="spinner-border text-primary"></div>
            <p class="mt-3">Loading your saved recipes...</p>
          </div>

          <!-- No Recipes State -->
          <div v-else-if="savedRecipes.length === 0" class="no-recipes">
            <i class="bi bi-bookmark-x"></i>
            <h3>No Recipes Saved Yet</h3>
            <p>Start exploring and save your favorite recipes to see them here!</p>
            <button @click="router.push('/recipes')" class="btn btn-danger">
              <i class="bi bi-search me-2" style="font-size:1rem;color:white"></i>
              Discover Recipes
            </button>
          </div>

          <!-- Recipes Content -->
          <div v-else class="container mx-auto px-4 py-8">
            <!-- Swipe Mode - Horizontal Carousel -->
            <template v-if="isSwipeMode">
              <div
                ref="scrollContainerRef"
                @mousedown="handleMouseDown"
                @mousemove="handleMouseMove"
                @mouseup="handleMouseUp"
                @mouseleave="handleMouseLeave"
                :class="[
                  'flex gap-6 overflow-x-auto overflow-y-hidden pb-4 scrollbar-hide',
                  isDragging ? 'cursor-grabbing' : 'cursor-grab'
                ]"
                :style="{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }"
              >
                <RecipeCard
                  v-for="recipe in savedRecipes"
                  :key="recipe.id"
                  :recipe="recipe"
                  :image="recipe.image"
                  :title="recipe.title"
                  :time="recipe.readyInMinutes"
                  :servings="recipe.servings"
                  :current-user="currentUser"
                  :show-remove-confirmation="true"
                  @click="openModal"
                  @removed="handleRecipeRemoved"
                />
              </div>
              <RecipeModal
                  :recipe="selectedRecipe"
                  @close="selectedRecipe = null"
              />
              <!-- Scroll Indicator -->
              <div class="text-center mt-4">
                <p class="text-sm text-muted-foreground">
                  ← Swipe or scroll horizontally to view more recipes →
                </p>
              </div>
            </template>

            <template v-else>
              <!-- Scroll Mode - Vertical Grid -->
              <div class="recipes-grid">
                <RecipeCard
                  v-for="recipe in savedRecipes"
                  :key="recipe.id"
                  :recipe="recipe"
                  :image="recipe.image"
                  :title="recipe.title"
                  :time="recipe.readyInMinutes"
                  :servings="recipe.servings"
                  :current-user="currentUser"
                  :show-remove-confirmation="true"
                  @click="openModal"
                  @removed="handleRecipeRemoved"
                />
              </div>
              <RecipeModal
                :recipe="selectedRecipe"
                @close="selectedRecipe = null"
              />
            </template>

          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, getCurrentUser } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import RecipeCard from '@/components/RecipeCard.vue'
import RecipeModal from '@/components/RecipeModal.vue'
import axios from 'axios'
import { Carousel } from 'bootstrap'
import Swal from 'sweetalert2'

const router = useRouter()
const currentUser = ref(null)

const SPOONACULAR_API_KEY = [
  import.meta.env.VITE_SPOONACULAR_KEY_1,
  import.meta.env.VITE_SPOONACULAR_KEY_2,
  import.meta.env.VITE_SPOONACULAR_KEY_3,
  import.meta.env.VITE_SPOONACULAR_KEY_4,
  import.meta.env.VITE_SPOONACULAR_KEY_5,
].filter(Boolean)

let currentKeyIndex = 0

// Pantry images - will be populated with popular recipes
const pantryImages = ref([])
const loadingPopularRecipes = ref(true)
const selectedCarouselRecipe= ref(null)

// State
const expiringItems = ref([])
const savedRecipes = ref([])
const totalPantryItems = ref(0)
const selectedRecipe = ref(null)
const showContent = ref(false)
const loadingSavedRecipes = ref(false)
const scrollContainerRef = ref(null)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)
const isSwipeMode = ref(true)

const makeSpoonacularRequest = async (url, params, retries = SPOONACULAR_API_KEY.length) => {
  try {
    const response = await axios.get(url, {
      params: {
        ...params,
        apiKey: SPOONACULAR_API_KEY[currentKeyIndex]
      }
    })
    return response
  } catch (error) {
    if ((error.response?.status === 402 || error.response?.status === 401) && retries > 1) {
      console.log(`API key ${currentKeyIndex + 1} failed, trying next key...`)
      currentKeyIndex = (currentKeyIndex + 1) % SPOONACULAR_API_KEY.length
      return makeSpoonacularRequest(url, params, retries - 1)
    }
    throw error
  }
}

watch(loadingPopularRecipes, async (isLoading) => {
  if (!isLoading && pantryImages.value.length > 0) {
    await nextTick()
    const carouselEl = document.getElementById('pantryCarousel')
    if (carouselEl) {
      new Carousel(carouselEl, {
        interval: 3000,
        ride: 'carousel'
      })
    }
  }
})

const toggleViewMode = () => {
  isSwipeMode.value = !isSwipeMode.value
}

const openModal = async (recipe) => {
  let parsedRecipe = { ...recipe }

  // Parse JSON fields if stored as strings
  try {
    if (typeof parsedRecipe.analyzedInstructions === 'string') {
      parsedRecipe.analyzedInstructions = JSON.parse(parsedRecipe.analyzedInstructions)
    }
  } catch (err) {
    console.warn('Failed to parse analyzedInstructions:', err)
  }

  try {
    if (typeof parsedRecipe.extendedIngredients === 'string') {
      parsedRecipe.extendedIngredients = JSON.parse(parsedRecipe.extendedIngredients)
    }
  } catch (err) {
    console.warn('Failed to parse extendedIngredients:', err)
  }

  // If missing, fetch full recipe info from Spoonacular
  if (!parsedRecipe.extendedIngredients || !parsedRecipe.analyzedInstructions) {
    try {
      const response = await makeSpoonacularRequest(
        `https://api.spoonacular.com/recipes/${parsedRecipe.id}/information`,
        { includeNutrition: true }
      )
      parsedRecipe = { ...parsedRecipe, ...response.data }

      // Optional: update Supabase with full info (cache it)
      await supabase
        .from('saved_recipes')
        .update({
          analyzedInstructions: JSON.stringify(response.data.analyzedInstructions || []),
          extendedIngredients: JSON.stringify(response.data.extendedIngredients || [])
        })
        .eq('id', parsedRecipe.id)
        .eq('user_id', currentUser.value.id)
    } catch (err) {
      console.error('Error fetching recipe details:', err)
      Swal.fire('Error', 'Unable to load recipe details.', 'error')
    }
  }

  selectedRecipe.value = parsedRecipe
}


// Handle recipe removal from RecipeCard component
const handleRecipeRemoved = (recipeId) => {
  // Immediately remove from local state for instant UI update
  savedRecipes.value = savedRecipes.value.filter(r => r.id !== recipeId)
}


// Mouse handler functions for horizontal scrolling
const handleMouseDown = (e) => {
  if (!scrollContainerRef.value) return
  isDragging.value = true
  startX.value = e.pageX - scrollContainerRef.value.offsetLeft
  scrollLeft.value = scrollContainerRef.value.scrollLeft
}

const handleMouseMove = (e) => {
  if (!isDragging.value || !scrollContainerRef.value) return
  e.preventDefault()
  const x = e.pageX - scrollContainerRef.value.offsetLeft
  const walk = (x - startX.value) * 2
  scrollContainerRef.value.scrollLeft = scrollLeft.value - walk
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleMouseLeave = () => {
  isDragging.value = false
}

// Fetch saved recipes from Supabase
const fetchSavedRecipes = async () => {
  loadingSavedRecipes.value = true
  try {
    const { data, error } = await supabase
      .from('saved_recipes')
      .select(`
        id, title, image, readyInMinutes, servings,
        aggregateLikes, analyzedInstructions, extendedIngredients,
        vegetarian, vegan, glutenFree, created_at
      `)
      .eq('user_id', currentUser.value.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    savedRecipes.value = data || []
  } catch (error) {
    console.error('Error fetching saved recipes:', error)
    savedRecipes.value = []
  } finally {
    loadingSavedRecipes.value = false
  }
}

// Default carousel images fallback
const getDefaultCarouselImages = () => [
  {
    id: 'default-1',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    title: 'Explore Fresh Recipes',
    description: 'Discover delicious meals you can make with your pantry items',
    recipe: null,
  },
  {
    id: 'default-2',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    title: 'Cook with Confidence',
    description: 'Find recipes that match your ingredients and skill level',
    recipe: null,
  },
  {
    id: 'default-3',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    title: 'Reduce Food Waste',
    description: 'Use expiring ingredients before they go bad',
    recipe: null,
  },
  {
    id: 'default-4',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061',
    title: 'Plan Your Meals',
    description: 'Organize your weekly menu with ease',
    recipe: null,
  },
  {
    id: 'default-5',
    image: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488',
    title: 'Fresh Ingredients',
    description: 'Track your pantry and keep ingredients organized'
  }
]

// Fetch top 5 popular recipes from Spoonacular
const fetchPopularRecipes = async () => {
  loadingPopularRecipes.value = true

  try {
    const { data: cachedRecipes, error: fetchError } = await supabase
      .from('popular_recipes')
      .select('*')
      .order('aggregateLikes', { ascending: false })
      .limit(5)

    if (fetchError) throw fetchError

    const isCacheFresh = cachedRecipes && cachedRecipes.length > 0 &&
      cachedRecipes.some(recipe => {
        const updatedAt = new Date(recipe.updated_at)
        const hoursSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60)
        return hoursSinceUpdate < 24
      })

    if (isCacheFresh && cachedRecipes.length >= 5) {
      console.log('Using cached popular recipes')

      pantryImages.value = cachedRecipes.map(recipe => ({
        id: recipe.id,
        image: recipe.image,
        title: recipe.title,
        description: recipe.summary
          ? recipe.summary.replace(/<[^>]*>/g, '').substring(0, 120) + '...'
          : `Ready in ${recipe.readyInMinutes} min • ${recipe.servings} servings`,
        recipe: recipe
      }))

      loadingPopularRecipes.value = false
      return
    }

    console.log('Fetching fresh popular recipes from API')
    const response = await makeSpoonacularRequest(
      'https://api.spoonacular.com/recipes/complexSearch',
      {
        number: 5,
        sort: 'popularity',
        sortDirection: 'desc',
        addRecipeInformation: true,
        instructionsRequired: true,
        addRecipeNutrition: true,
        fillIngredients: true,
        minLikes: 100
      }
    )

    if (!response.data.results || response.data.results.length === 0) {
      console.warn('No popular recipes found, using defaults')
      pantryImages.value = getDefaultCarouselImages()
      return
    }

    const recipesToSave = response.data.results.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      summary: recipe.summary || '',
      readyInMinutes: recipe.readyInMinutes || 0,
      servings: recipe.servings || 0,
      aggregateLikes: recipe.aggregateLikes || 0,
      analyzedInstructions: recipe.analyzedInstructions
        ? JSON.stringify(recipe.analyzedInstructions)
        : '',
      dishTypes: recipe.dishTypes || [],
      vegetarian: recipe.vegetarian || false,
      vegan: recipe.vegan || false,
      glutenFree: recipe.glutenFree || false,
      calories: recipe.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 0,
      protein: recipe.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0,
      carbs: recipe.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0,
      fats: recipe.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0,
      updated_at: new Date().toISOString()
    }))

    const { error: upsertError } = await supabase
      .from('popular_recipes')
      .upsert(recipesToSave, { onConflict: 'id' })

    if (upsertError) {
      console.error('Error caching recipes:', upsertError)
    } else {
      console.log('Popular recipes cached successfully')
    }

    pantryImages.value = response.data.results.map(recipe => {
      let description = ''
      if (recipe.summary) {
        description = recipe.summary.replace(/<[^>]*>/g, '').substring(0, 120) + '...'
      } else {
        description = `Ready in ${recipe.readyInMinutes} min • ${recipe.servings} servings`
      }

      return {
        id: recipe.id,
        image: recipe.image,
        title: recipe.title,
        description: description,
        recipe: recipe
      }
    })

    console.log('Popular recipes loaded for carousel:', pantryImages.value.length)
  } catch (error) {
    console.error('Error fetching popular recipes:', error)

    if (error.response?.status === 402) {
      console.warn('All API keys exceeded quota')
    } else if (error.response?.status === 401) {
      console.error('All API keys invalid')
    }

    pantryImages.value = getDefaultCarouselImages()
  } finally {
    loadingPopularRecipes.value = false
  }
}

const showRecipeDetails = async (img) => {
  if (!img.recipe || !img.recipe.id) return

  try {
    const response = await makeSpoonacularRequest(
      `https://api.spoonacular.com/recipes/${img.recipe.id}/information`,
      { includeNutrition: true }
    )

    // Spoonacular returns full recipe info here
    selectedCarouselRecipe.value = response.data
  } catch (error) {
    console.error('Error fetching full recipe details:', error)
    Swal.fire('Error', 'Unable to load full recipe details.', 'error')
  }
}


const fetchPantryItems = async () => {
  try {
    const { data, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', currentUser.value.id)

    if (error) throw error
    totalPantryItems.value = data?.length || 0
  } catch (error) {
    console.error('Error fetching pantry items:', error)
  }
}

const fetchExpiringItems = async () => {
  try {
    const today = new Date()
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .lte('expiration', sevenDaysLater.toISOString())
      .gte('expiration', today.toISOString())
      .order('expiration', { ascending: true })

    if (error) throw error

    expiringItems.value = (data || []).map(item => {
      const expiryDate = new Date(item.expiration)
      const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
      return {
        id: item.id,
        name: item.name,
        category: item.category || 'Other',
        daysLeft
      }
    })
  } catch (error) {
    console.error('Error fetching expiring items:', error)
  }
}

const getExpirySeverityClass = (daysLeft) => {
  if (daysLeft <= 2) return 'bg-danger'
  if (daysLeft <= 4) return 'bg-warning'
  return 'bg-info'
}

const findRecipesWithExpiringItems = () => {
  // Extract just the ingredient names from expiring items
  const expiringIngredients = expiringItems.value
    .map(item => item.name.trim())
    .filter(Boolean)
    .join(',')

  console.log('Expiring items:', expiringItems.value)
  console.log('Navigating with ingredients:', expiringIngredients)

  if (!expiringIngredients) {
    console.error('No ingredients to search with')
    return
  }

  router.push({
    path: '/recipes',
    query: {
      autoSearch: 'expiring',
      ingredients: expiringIngredients
    }
  })
}

onMounted(async () => {
  try {
    currentUser.value = await getCurrentUser()

    if (!currentUser.value) {
      router.push('/login')
      return
    }

    await fetchPopularRecipes()
    await fetchSavedRecipes()

    await Promise.all([
      fetchPantryItems(),
      fetchExpiringItems()
    ])

    setTimeout(() => {
      showContent.value = true
    }, 1000)
  } catch (error) {
    console.error('Error initializing:', error)
    router.push('/login')
  }
})

// Check if a recipe is saved
const isRecipeSaved = (recipeId) => {
  return savedRecipes.value.some(r => r.id === recipeId)
}

// Toggle favourite status (for carousel only)
const toggleFavourite = async (recipe) => {
  const saved = isRecipeSaved(recipe.id)

  if (saved) {
    // Confirm before removing
    const result = await Swal.fire({
      title: 'Remove from favourites?',
      text: 'Are you sure you want to unfavourite this recipe?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, remove it',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('id', recipe.id)
        .eq('user_id', currentUser.value.id)
      if (error) throw error

      // Immediately remove from local state for instant UI update
      savedRecipes.value = savedRecipes.value.filter(r => r.id !== recipe.id)

      Swal.fire({
        title: 'Removed!',
        text: 'Recipe has been removed from your favourites.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (error) {
      console.error(error)
      Swal.fire('Error', 'Failed to remove recipe', 'error')
    }
  } else {
    // Add to favourites
    try {
      const newRecipe = {
        user_id: currentUser.value.id,
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes || 0,
        servings: recipe.servings || 0,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('saved_recipes')
        .insert(newRecipe)

      if (error) throw error

      // Add to the START of the list (most recent first) for instant UI update
      savedRecipes.value.unshift({
        ...newRecipe,
        ...recipe
      })

      Swal.fire({
        title: 'Added!',
        text: 'Recipe has been added to your favourites.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (error) {
      console.error(error)
      Swal.fire('Error', 'Failed to add recipe', 'error')
    }
  }
}
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  padding-bottom: 4rem;
  transition: opacity 0.6s ease, transform 0.6s ease;
}

/* Hero Section */
.hero-section {
  height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  margin-bottom: 3rem;

  background:
    linear-gradient(135deg, rgba(255, 107, 26, 0.15) 0%, rgba(255, 152, 0, 0.15) 100%),
    /* url('https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200') center/cover; */
    /* url('https://plus.unsplash.com/premium_photo-1684445034987-5c13450cb5b1?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2940') center/cover; */
    url('/background.jpg') center/cover;

  background-attachment: fixed;
}

.hero-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, transparent 0%, rgba(255, 248, 240, 0.2) 100%);
  pointer-events: none;
}

@keyframes bgZoom {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.hero-section::after {
  content: '';
  position: absolute;
  inset: 0;
  background: inherit;
  animation: bgZoom 20s ease-in-out infinite;
  z-index: 0;
}

.hero-content {
  position: relative;
  z-index: 2;
}

.animate-fade-in {
  animation: fadeIn 1s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: bold;
  color: #6b46c1;
  margin-bottom: 1rem;
  letter-spacing: 0.5px;
}

@keyframes titleGlow {
  0%, 100% {
    filter: drop-shadow(0 0 20px rgba(255, 152, 0, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 30px rgba(255, 152, 0, 0.8));
  }
}

.hero-subtitle {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: #ffffff;
  max-width: 600px;
  margin: 0 auto;
  text-shadow:
    0 2px 8px rgba(0, 0, 0, 0.4),
    0 4px 16px rgba(0, 0, 0, 0.2);
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: 500;
  letter-spacing: 0.3px;
}

/* Content Grid */
.content-grid {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
  align-items: center;
}

.content-grid.content-visible {
  opacity: 1;
  transform: translateY(0);
}

.stagger-item {
  opacity: 0;
  transform: translateY(30px);
}

.content-visible .stagger-item {
  animation: slideUp 0.9s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
  animation-delay: calc(var(--stagger) * 0.2s);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 992px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

/* Card Styling */
.alert-header {
  background: none;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.alert-header i {
  font-size: 2rem;
  color: rgb(220, 38, 38);
}

.alert-header h3 {
  margin: 0;
  color: #6b46c1;
  font-size: 1.25rem;
  font-weight: 700;
}

.alert-header p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  opacity: 0.95;
  color: #666;
}

/* Carousel Loading State */
.carousel-loading {
  height: 450px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  gap: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.carousel-loading p {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

/* Carousel */
.carousel-item-wrapper {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.carousel-image {
  width: 100%;
  height: 450px;
  object-fit: cover;
  transition: transform 0.3s;
}

.carousel-item:hover .carousel-image {
  transform: scale(1.05);
}

.carousel-caption-custom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.4), transparent);
  color: white;
  padding: 3rem 2rem 2rem;
}

.carousel-caption-custom h4 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.carousel-caption-custom p {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.95;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.carousel-control-prev,
.carousel-control-next {
  width: 50px;
  opacity: 0.8;
  transition: all 0.3s;
}

.carousel-control-prev:hover,
.carousel-control-next:hover {
  opacity: 1;
}

.carousel-indicators {
  margin-bottom: 1.5rem;
}

.carousel-indicators button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.6);
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}

.carousel-indicators button.active {
  background-color: #ff6b1a;
  border-color: #ff6b1a;
  transform: scale(1.2);
}

/* Expiring Items */
.no-items {
  text-align: center;
  padding: 2rem;
  color: #10b981;
}

.no-items i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Beige container for the entire expiring section */
.expiring-container {
  background-color: #fff7ed;
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  height: 450px;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
}

/* Expiring Card inside the container */
.expiring-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(to right, rgba(254,242,242,0.8), rgba(255,247,237,0.8));
  border-radius: 1rem;
  overflow: hidden;
}

/* Alert header - fixed at top */
.alert-header {
  flex-shrink: 0;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Card body adjustments */
.card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0 1rem 1rem;
  overflow: hidden;
}

/* Scrollable wrapper (fills space between header and button) */
.expiring-scroll-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 0.5rem;
}

/* No items message */
.no-items {
  text-align: center;
  padding: 2rem;
  color: #10b981;
}

.no-items i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* List container */
.expiring-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 0.5rem;
}

/* Scrollbar styling */
.expiring-scroll-wrapper::-webkit-scrollbar {
  width: 8px;
}

.expiring-scroll-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.expiring-scroll-wrapper::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 8px;
}

.expiring-scroll-wrapper::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Individual expiring item */
.expiring-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: transform 0.2s;
}

.expiring-item:hover {
  transform: translateX(4px);
}

.item-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  border-radius: 50%;
  color: white;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-details strong {
  color: #1a1a1a;
  font-size: 1rem;
}

.item-category {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Button fixed at bottom */
.expiring-button-wrapper {
  flex-shrink: 0;
}

/* Saved Recipes Section */
.saved-recipes-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.saved-recipes-section.content-visible {
  opacity: 1;
  transform: translateY(0);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  font-size: 1.9rem;
  margin: 0;
  color: #6b46c1;
  font-weight: 700;
}

.no-recipes {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.no-recipes i {
  font-size: 4rem;
  color: #ff6b1a;
  margin-bottom: 1rem;
}

.no-recipes h3 {
  margin: 0 0 0.5rem;
  color: #1a1a1a;
  font-weight: 700;
}

.no-recipes p {
  color: #6b7280;
  margin-bottom: 2rem;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.recipe-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.recipe-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.recipe-image-wrapper {
  width: 100%;
  height: 200px;
  overflow: hidden;
  position: relative;
}

.recipe-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
  cursor: pointer;
}

.recipe-card:hover .recipe-image {
  transform: scale(1.05);
}

.recipe-card-body {
  padding: 1.25rem;
}

.recipe-title {
  margin: 0 0 0.75rem;
  font-size: 1.125rem;
  color: #1a1a1a;
  font-weight: 700;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recipe-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.recipe-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.recipe-meta i {
  color: #ff6b1a;
}

.recipe-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.recipe-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-item i {
  font-size: 1.5rem;
  color: #ff6b1a;
}

.info-item small {
  display: block;
  color: #6b7280;
  font-size: 0.75rem;
}

.info-item strong {
  font-size: 1.125rem;
  color: #1a1a1a;
}

.recipe-section {
  margin-bottom: 2rem;
}

.recipe-section h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: #1a1a1a;
  font-weight: 700;
}

.ingredients-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}

.ingredients-list li {
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid #ff6b1a;
}

.instructions {
  line-height: 1.8;
  color: #374151;
}

.modal-footer-custom {
  padding: 1.5rem 2rem;
  border-top: 1px solid #f0f0f0;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.text-center {
  text-align: center;
}

.py-12 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.mt-3 {
  margin-top: 0.75rem;
}

.text-muted-foreground {
  color: #6b7280;
}

.flex {
  display: flex;
}

.gap-6 {
  gap: 1.5rem;
}

.overflow-x-auto {
  overflow-x: auto;
}

.overflow-y-hidden {
  overflow-y: hidden;
}

.pb-4 {
  padding-bottom: 1rem;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}

.text-sm {
  font-size: 0.875rem;
}

.mt-4 {
  margin-top: 1rem;
}
/* View Mode Toggle Styles */
.view-mode-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  user-select: none;
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 24px;
  background-color: #d1d5db;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
  padding: 2px;
}

.toggle-switch:hover {
  background-color: #9ca3af;
}

.toggle-switch.active {
  background-color: #ff6b1a;
}

.toggle-switch.active:hover {
  background-color: #ff8534;
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch.active .toggle-slider {
  transform: translateX(24px);
}

/* Responsive */
@media (max-width: 768px) {
  .hero-section {
    height: 40vh;
  }

  .recipe-info-grid {
    grid-template-columns: 1fr;
  }

  .carousel-image,
  .carousel-loading {
    height: 300px;
  }

  .carousel-caption-custom {
    padding: 2rem 1rem 1rem;
  }

  .carousel-caption-custom h4 {
    font-size: 1.25rem;
  }

  .carousel-caption-custom p {
    font-size: 0.85rem;
  }
}

@media (max-width: 576px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .recipes-grid {
    grid-template-columns: 1fr;
  }
}

.favourite-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 5; /* higher than caption and image */
  background-color: rgba(255, 255, 255, 0.85);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  transition: transform 0.2s;
}

.favourite-btn:hover {
  transform: scale(1.1);
  background-color: rgba(255, 255, 255, 1);
}

.favourite-btn .bi-heart-fill {
  color: #ff6b1a;
}

.favourite-btn .bi-heart {
  color: #6b7280;
}


</style>
