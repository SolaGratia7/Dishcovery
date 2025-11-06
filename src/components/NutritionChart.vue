<template>
  <div class="nutrition-chart-card">
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <p v-if="subtitle" class="chart-subtitle">{{ subtitle }}</p>
    </div>
    <div class="chart-container">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    required: true,
    validator: (value) => ['doughnut', 'bar', 'line', 'pie'].includes(value)
  },
  data: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    default: () => ({})
  }
});

const canvasRef = ref(null);
let chartInstance = null;

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        padding: 15,
        font: {
          size: 12,
          family: "'Inter', sans-serif"
        },
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 13
      }
    }
  }
};

const createChart = () => {
  if (chartInstance) {
    chartInstance.destroy();
  }

  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  const mergedOptions = {
    ...defaultOptions,
    ...props.options
  };

  chartInstance = new Chart(ctx, {
    type: props.type,
    data: props.data,
    options: mergedOptions
  });
};

onMounted(() => {
  nextTick(() => {
    createChart();
  });
});

watch(() => props.data, () => {
  if (chartInstance) {
    chartInstance.data = props.data;
    chartInstance.update();
  }
}, { deep: true });

watch(() => props.options, () => {
  createChart();
}, { deep: true });
</script>

<style scoped>
.nutrition-chart-card {
  background: var(--card-bg, #ffffff);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.nutrition-chart-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.chart-header {
  margin-bottom: 1.5rem;
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0 0 0.25rem 0;
}

.chart-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  margin: 0;
}

.chart-container {
  flex: 1;
  position: relative;
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-container canvas {
  max-height: 300px;
}

/* Responsive */
@media (max-width: 768px) {
  .nutrition-chart-card {
    padding: 1rem;
  }
  
  .chart-container {
    min-height: 200px;
  }

  .chart-container canvas {
    max-height: 250px;
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

.nutrition-chart-card {
  animation: fade-in 0.4s ease-out;
}
</style>