const SHOPPING_STORAGE_KEY = 'dishcoveryData';
const PLANNING_STORAGE_KEY = 'recipeFinderData';

let appState = {
  shoppingList: [],
  loggedMeals: [],
  nutritionGoals: { 
    calories: 2000, 
    protein: 150, 
    carbs: 250, 
    fat: 65 
  },
};

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderShoppingList();
  renderLoggedMeals();
  initCharts();
  updateNutritionDisplay();
  attachEventListeners();
});

function loadState() {
  const saved = localStorage.getItem(SHOPPING_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      appState = Object.assign(appState, parsed);
    } catch (e) {
      console.error('Failed to parse saved state:', e);
    }
  }
}

function saveState() {
  try {
    localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

const categoryMap = {
  produce: 'Produce',
  dairy: 'Dairy',
  meat: 'Meat/Fish',
  pantry: 'Pantry',
  other: 'Other'
};

const categoryClass = {
  produce: 'cat-produce',
  dairy: 'cat-dairy',
  meat: 'cat-meat',
  pantry: 'cat-pantry',
  other: 'cat-other'
};

function renderShoppingList() {
  const display = document.getElementById('shopping-list-display');
  const summary = document.getElementById('shopping-summary');
  const count = document.getElementById('shopping-count');

  if (appState.shoppingList.length === 0) {
    display.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-cart"></i><p>Your shopping list is empty. Add items above!</p></div>';
    summary.innerHTML = '<p class="text-muted text-center">Add items to see summary</p>';
    count.textContent = '0 items';
    return;
  }

  count.textContent = appState.shoppingList.length + ' item' + (appState.shoppingList.length !== 1 ? 's' : '');
  display.innerHTML = '';

  const grouped = {};
  appState.shoppingList.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  Object.entries(grouped).forEach(([cat, items]) => {
    const section = document.createElement('div');
    section.innerHTML = `<h6 class="mt-3 mb-2 text-muted">${categoryMap[cat]}</h6>`;

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'shopping-item' + (item.checked ? ' checked' : '');
      div.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
          <div>
            <input type="checkbox" class="form-check-input" ${item.checked ? 'checked' : ''} 
                   onchange="toggleShoppingItem(${item.id})">
            <span class="item-name">${item.name}</span>
            <span class="item-category-badge ${categoryClass[cat]}">${item.qty} ${item.unit}</span>
          </div>
          <button class="btn btn-sm btn-outline-danger" onclick="removeShoppingItem(${item.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      section.appendChild(div);
    });

    display.appendChild(section);
  });

  const checked = appState.shoppingList.filter(i => i.checked).length;
  const total = appState.shoppingList.length;
  const percentage = Math.round((checked / total) * 100);

  summary.innerHTML = `
    <div class="mb-3">
      <div class="progress">
        <div class="progress-bar" style="width: ${percentage}%"></div>
      </div>
      <small class="text-muted">${checked} of ${total} checked</small>
    </div>
    <div class="text-center">
      <p class="mb-0"><strong>${percentage}%</strong></p>
      <small class="text-muted">Complete</small>
    </div>
  `;
}

function toggleShoppingItem(id) {
  const item = appState.shoppingList.find(i => i.id === id);
  if (item) {
    item.checked = !item.checked;
    saveState();
    renderShoppingList();
  }
}

function removeShoppingItem(id) {
  appState.shoppingList = appState.shoppingList.filter(i => i.id !== id);
  saveState();
  renderShoppingList();
}

function addShoppingItem(e) {
  e.preventDefault();
  const name = document.getElementById('shopping-item-name').value.trim();
  const qty = parseFloat(document.getElementById('shopping-item-qty').value);
  const unit = document.getElementById('shopping-item-unit').value;
  const category = document.getElementById('shopping-item-cat').value;

  if (!name || qty <= 0) {
    alert('Please fill in all fields with valid values');
    return;
  }

  appState.shoppingList.push({
    id: Date.now(),
    name,
    qty,
    unit,
    category,
    checked: false
  });

  saveState();
  renderShoppingList();
  document.getElementById('shopping-add-form').reset();
}

function clearShoppingList() {
  if (confirm('Clear all items from shopping list?')) {
    appState.shoppingList = [];
    saveState();
    renderShoppingList();
  }
}

function getTodaysTotal() {
  return appState.loggedMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function updateNutritionDisplay() {
  const totals = getTodaysTotal();
  const goals = appState.nutritionGoals;

  const calPct = Math.round((totals.calories / goals.calories) * 100);
  const protPct = Math.round((totals.protein / goals.protein) * 100);
  const carbPct = Math.round((totals.carbs / goals.carbs) * 100);
  const fatPct = Math.round((totals.fat / goals.fat) * 100);

  document.getElementById('cal-value').textContent = totals.calories;
  document.getElementById('cal-display').textContent = calPct + '%';
  document.getElementById('prot-value').textContent = totals.protein.toFixed(1) + 'g';
  document.getElementById('prot-display').textContent = protPct + '%';
  document.getElementById('carb-value').textContent = totals.carbs.toFixed(1) + 'g';
  document.getElementById('carb-display').textContent = carbPct + '%';
  document.getElementById('fat-value').textContent = totals.fat.toFixed(1) + 'g';
  document.getElementById('fat-display').textContent = fatPct + '%';

  if (window.macroChart) {
    window.macroChart.data.datasets[0].data = [totals.protein, totals.carbs, totals.fat];
    window.macroChart.update();
  }

  if (window.progressChart) {
    window.progressChart.data.datasets[0].data = [calPct, protPct, carbPct, fatPct];
    window.progressChart.update();
  }
}

function renderLoggedMeals() {
  const display = document.getElementById('logged-meals-display');

  if (appState.loggedMeals.length === 0) {
    display.innerHTML = '<div class="empty-state"><i class="fas fa-utensils"></i><p>No meals logged yet. Log a meal above!</p></div>';
    return;
  }

  display.innerHTML = '';
  appState.loggedMeals.forEach(meal => {
    const div = document.createElement('div');
    div.className = 'shopping-item';
    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>${meal.name}</strong>
          <div class="small text-muted">
            ${meal.calories} cal | ${meal.protein.toFixed(1)}g protein | ${meal.carbs.toFixed(1)}g carbs | ${meal.fat.toFixed(1)}g fat
          </div>
        </div>
        <button class="btn btn-sm btn-outline-danger" onclick="removeMeal(${meal.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    display.appendChild(div);
  });
}

function removeMeal(id) {
  appState.loggedMeals = appState.loggedMeals.filter(m => m.id !== id);
  saveState();
  renderLoggedMeals();
  updateNutritionDisplay();
}

function addMeal(e) {
  e.preventDefault();

  const name = document.getElementById('meal-name').value.trim();
  const calories = parseFloat(document.getElementById('meal-calories').value);
  const protein = parseFloat(document.getElementById('meal-protein').value);
  const carbs = parseFloat(document.getElementById('meal-carbs').value);
  const fat = parseFloat(document.getElementById('meal-fat').value);

  if (!name || isNaN(calories) || isNaN(protein) || isNaN(carbs) || isNaN(fat)) {
    alert('Please fill in all fields with valid numbers');
    return;
  }

  appState.loggedMeals.push({
    id: Date.now(),
    name,
    calories,
    protein,
    carbs,
    fat
  });

  saveState();
  renderLoggedMeals();
  updateNutritionDisplay();
  document.getElementById('nutrition-log-form').reset();
}

function initCharts() {
  const totals = getTodaysTotal();
  const goals = appState.nutritionGoals;

  // macro breakdown chart
  const macroCtx = document.getElementById('macroChart').getContext('2d');
  window.macroChart = new Chart(macroCtx, {
    type: 'doughnut',
    data: {
      labels: ['Protein', 'Carbs', 'Fat'],
      datasets: [{
        data: [totals.protein, totals.carbs, totals.fat],
        backgroundColor: ['#f5576c', '#00f2fe', '#fee140'],
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  // progress chart
  const progressCtx = document.getElementById('progressChart').getContext('2d');
  window.progressChart = new Chart(progressCtx, {
    type: 'bar',
    data: {
      labels: ['Calories', 'Protein', 'Carbs', 'Fat'],
      datasets: [{
        label: '% of Goal',
        data: [
          Math.round((totals.calories / goals.calories) * 100),
          Math.round((totals.protein / goals.protein) * 100),
          Math.round((totals.carbs / goals.carbs) * 100),
          Math.round((totals.fat / goals.fat) * 100)
        ],
        backgroundColor: ['#667eea', '#f5576c', '#00f2fe', '#fee140']
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { beginAtZero: true, max: 150 }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function attachEventListeners() {
  document.getElementById('shopping-add-form')?.addEventListener('submit', addShoppingItem);
  document.getElementById('nutrition-log-form')?.addEventListener('submit', addMeal);
  document.getElementById('clear-list-btn')?.addEventListener('click', clearShoppingList);
}