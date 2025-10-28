<template>
  <div class="recipe-card" @click="handleCardClick">
    <div class="recipe-image-container">
      <img :src="image" :alt="title" class="recipe-image" />

      <!-- Favorite Button -->
      <button class="favorite-btn" @click="toggleFavourite">
        <i :class="isFavourite ? 'bi bi-heart-fill text-red-500' : 'bi bi-heart text-gray-400'"></i>
      </button>

      <div class="image-overlay" />
    </div>

    <div class="recipe-content">
      <h3 class="recipe-title">{{ title }}</h3>
      <div class="recipe-meta">
        <div class="meta-item"><i class="bi bi-clock"></i> <span>{{ time }} min</span></div>
        <div class="meta-item"><i class="bi bi-people"></i> <span>{{ servings }} servings</span></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase, getCurrentUser } from '@/lib/supabase'
import Swal from 'sweetalert2'

const props = defineProps({
  recipe: Object,
  image: String,
  title: String,
  time: Number,
  servings: Number
})

const emit = defineEmits(['click', 'removed'])

const currentUser = ref(null)
const isFavourite = ref(false)

onMounted(async () => {
  currentUser.value = await getCurrentUser()
  if (currentUser.value && props.recipe) {
    const { data } = await supabase
      .from('saved_recipes')
      .select('id')
      .eq('user_id', currentUser.value.id)
      .eq('id', props.recipe.id)
      .single()
    isFavourite.value = !!data
  }
})

const handleCardClick = (e) => {
  // Prevent modal opening when clicking favourite button
  if (e.target.closest('.favorite-btn')) return
  emit('click', props.recipe)
}

const toggleFavourite = async () => {
  if (!currentUser.value) {
    Swal.fire('Please log in first', '', 'info')
    return
  }

  try {
    if (isFavourite.value) {
      // Remove from favorites
      await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', currentUser.value.id)
        .eq('id', props.recipe.id)

      isFavourite.value = false
      emit('removed', props.recipe.id) // Notify parent to remove from list
      Swal.fire('Removed!', 'Recipe removed from favorites.', 'success')
    } else {
      // Add to favorites
      await supabase.from('saved_recipes').insert({
        user_id: currentUser.value.id,
        id: props.recipe.id,
        title: props.recipe.title,
        image: props.recipe.image,
        readyInMinutes: props.recipe.readyInMinutes,
        servings: props.recipe.servings
      })
      isFavourite.value = true
      Swal.fire('Saved!', 'Recipe added to favorites.', 'success')
    }
  } catch (err) {
    console.error(err)
    Swal.fire('Error', 'Something went wrong.', 'error')
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
  scroll-margin-top: 100px;
}

@media (min-width: 768px) {
  .recipe-card {
    min-width: 350px;
    margin-top: 0.5rem;
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
  z-index: 10; /* keep overlay below button */
  pointer-events: none;
}

.favorite-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  background: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
   z-index: 30;
}

.favorite-btn:hover {
  transform: scale(1.1);
  background: #fee2e2;
}

.favorite-btn i {
  font-size: 1.1rem;
  color: #ef4444;
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
