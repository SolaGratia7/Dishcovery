<template>
  <div class="recipe-card" @click="handleClick">
    <div class="recipe-image-container">
      <img
        :src="image"
        :alt="title"
        class="recipe-image"
      />
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
const props = defineProps({
  image: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  time: {
    type: Number,
    required: true
  },
  servings: {
    type: Number,
    required: true
  },
  recipe: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  // Emit the full recipe object so parent can use it for the modal
  emit('click', props.recipe)
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