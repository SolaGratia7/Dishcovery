<template>
  <div class="recipe-card" @click="handleClick">
    <div class="recipe-image-container">
      <img
        :src="image"
        :alt="title"
        class="recipe-image"
      />
      <!-- Remove favourite button -->
      <button class="favorite-btn" @click.stop="removeFavourite(recipe.id)">
        <i class="bi bi-x-circle-fill"></i> <!-- ❌ Cross sign icon -->
      </button>

      <div class="image-overlay" />
    </div>
    
    <div class="recipe-content">
      <h3 class="recipe-title">{{ title }}</h3>
      
      <div class="recipe-meta">
        <div class="meta-item">
          <i class="bi bi-clock"></i>
          <span>{{ time }} min</span>
        </div>
        
        <div class="meta-item">
          <i class="bi bi-people"></i>
          <span>{{ servings }} servings</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { supabase, getCurrentUser } from '@/lib/supabase'
import { ref, onMounted } from 'vue'

const props = defineProps({
  image: String,
  title: String,
  time: Number,
  servings: Number,
  recipe: Object
})

const emit = defineEmits(['click', 'removed'])

const currentUser = ref(null)
const savedRecipeIds = ref(new Set())

onMounted(async () => {
  currentUser.value = await getCurrentUser()
})

const handleClick = () => {
  // Emit the full recipe object so parent can open RecipeModal
  emit('click', props.recipe)
}

const removeFavourite = async (id) => {
  try {
    // Ensure user is logged in
    if (!currentUser.value) {
      alert('Please log in first.')
      return
    }

    // Check if recipe exists in Supabase favourites
    const { data: existing, error: fetchError } = await supabase
      .from('saved_recipes')
      .select('id')
      .eq('user_id', currentUser.value.id)
      .eq('id', id)
      .maybeSingle()

    if (fetchError) throw fetchError

    // If exists, delete it
    if (existing) {
      const { error: deleteError } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', currentUser.value.id)
        .eq('id', id)

      if (deleteError) throw deleteError

      // Update UI (remove from local favourite set)
      savedRecipeIds.value.delete(id)
      emit('removed', id) // Inform parent to refresh list if needed
      console.log(`Recipe ${id} removed from favourites.`)
    } else {
      console.warn(`Recipe ${id} not found in favourites.`)
    }
  } catch (error) {
    console.error('Error removing favourite:', error)
    alert('Failed to remove from favourites. Please try again.')
  }
}
</script>

<style scoped>
.recipe-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: none;
  min-width: 300px;
}

@media (min-width: 768px) {
  .recipe-card {
    min-width: 350px;
  }
}

.recipe-card:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  transform: translateY(-4px);
}

.recipe-image-container {
  aspect-ratio: 4/3;
  overflow: hidden;
  position: relative;
}

.recipe-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.recipe-card:hover .recipe-image {
  transform: scale(1.1);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 50%, transparent 100%);
}

.favorite-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;        /* remove background */
  border: none;            /* no border */
  color: white;            /* white cross for visibility on dark overlay */
  font-size: 1.5rem;       /* slightly larger cross */
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s ease;
}

.favorite-btn:hover {
  color: #ff4d4d;          /* soft red when hovered */
  transform: scale(1.1);   /* subtle enlarge on hover */
}

.recipe-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem;
  color: white;
}

.recipe-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.recipe-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.meta-item i {
  width: 1rem;
  height: 1rem;
}
</style>