<template>
  <div class="nutrition-card">
    <!-- Circular Progress -->
    <div class="progress-circle-wrapper">
      <svg class="progress-circle" viewBox="0 0 128 128">
        <!-- Background circle -->
        <circle
          cx="64"
          cy="64"
          r="56"
          :class="`circle-bg circle-${color}`"
        />
        <!-- Progress circle -->
        <circle
          cx="64"
          cy="64"
          r="56"
          :class="`circle-progress circle-${color}`"
          :style="{ strokeDashoffset: circumference * (1 - percentage / 100) }"
        />
      </svg>
      <!-- Percentage in center -->
      <div class="progress-text">
        <span :class="`percentage-${color}`">{{ percentage.toFixed(0) }}%</span>
      </div>
    </div>

    <!-- Icon and Label -->
    <div class="card-header">
      <h2 class="card-label">{{ label }}</h2>
    </div>
    
    <!-- Stats -->
    <div class="nutrition-stat">
      <div class="stat-value">
        {{ formatValue(current) }}{{ unitSymbol }}
      </div>
      <div class="stat-label">
        / {{ formatValue(goal) }}{{ unitSymbol }} {{ label.toLowerCase() }}
      </div>
      <div class="stat-remaining">
        {{ remaining > 0 ? `${formatValue(remaining)}${unitSymbol} remaining` : 'Goal reached!' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  current: {
    type: Number,
    required: true
  },
  goal: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'accent', 'warning'].includes(value)
  },
  decimals: {
    type: Number,
    default: 0
  }
});

const percentage = computed(() => {
  return Math.min((props.current / props.goal) * 100, 100);
});

const remaining = computed(() => {
  return Math.max(props.goal - props.current, 0);
});

const circumference = computed(() => {
  return 2 * Math.PI * 56;
});

const unitSymbol = computed(() => {
  if (props.unit === 'calories') return ' cal';
  if (props.unit === 'grams') return 'g';
  return props.unit ? ` ${props.unit}` : '';
});

const formatValue = (value) => {
  return props.decimals > 0 ? value.toFixed(props.decimals) : Math.round(value);
};
</script>

<style scoped>
.nutrition-card {
  background: var(--card-bg, #ffffff);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.nutrition-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* Circular Progress */
.progress-circle-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
}

.progress-circle {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.circle-bg,
.circle-progress {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
}

.circle-bg {
  opacity: 0.2;
}

.circle-progress {
  stroke-dasharray: 351.86;
  transition: stroke-dashoffset 0.5s ease-out;
}

/* Color variants */
.circle-primary { stroke: #3b82f6; }
.circle-secondary { stroke: #10b981; }
.circle-accent { stroke: #f59e0b; }
.circle-warning { stroke: #ef4444; }

.progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-text span {
  font-size: 1.5rem;
  font-weight: 700;
}

.percentage-primary { color: #3b82f6; }
.percentage-secondary { color: #10b981; }
.percentage-accent { color: #f59e0b; }
.percentage-warning { color: #ef4444; }

/* Card Header */
.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-label {
  font-size: 1.30rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0;
}

/* Stats */
.nutrition-stat {
  text-align: center;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary, #1f2937);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  margin-top: 0.25rem;
}

.stat-remaining {
  font-size: 0.75rem;
  color: var(--text-muted, #9ca3af);
  margin-top: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .nutrition-card {
    padding: 1rem;
  }
  
  .progress-circle-wrapper {
    width: 100px;
    height: 100px;
  }
  
  .progress-text span {
    font-size: 1.25rem;
  }
  
  .stat-value {
    font-size: 1.25rem;
  }
}

/* Animation */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.nutrition-card {
  animation: fade-in 0.4s ease-out;
}
</style>