<template>
  <div class="animated-bg">
    <div 
      v-for="i in 25" 
      :key="i"
      class="floating-circle"
      :style="getCircleStyle(i)"
    ></div>
    <div class="gradient-overlay"></div>
  </div>
</template>

<script setup>
const getCircleStyle = (index) => {
  // Use index as seed for pseudo-random but consistent values
  const random = (seed) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }
  
  // Generate size - make them more varied but proportional
  const sizeBase = random(index * 123.456)
  const size = 80 + (sizeBase * 220) // Size between 80-300px
  
  // Position
  const left = random(index * 78.910) * 100
  const top = random(index * 456.789) * 100
  
  // Color from palette
  const colors = [
    'linear-gradient(135deg, #ffd89b 0%, #ff9a56 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(135deg, #fff5e6 0%, #ffe0b3 100%)',
    'linear-gradient(135deg, #ffd6d6 0%, #ffb3b3 100%)',
  ]
  const colorIndex = index % colors.length
  
  // Animation timing
  const duration = 15 + random(index * 234.567) * 15 // 15-30s
  const delay = random(index * 345.678) * 5 // 0-5s
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    top: `${top}%`,
    background: colors[colorIndex],
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
  }
}
</script>

<style scoped>
.animated-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background: linear-gradient(135deg, #fef7f3 0%, #fef5ed 50%, #fef3e9 100%);
}

.floating-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.2;
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.3), transparent);
  pointer-events: none;
}
</style>