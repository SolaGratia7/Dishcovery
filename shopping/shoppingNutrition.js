const USE_LOCAL_DATABASE = true; // Set to false to use API when available

let appState = {
  shoppingList: [],
  loggedMeals: [],
  nutritionGoals: { 
    calories: 2000, 
    protein: 150, 
    carbs: 250, 
    fat: 65 
  },
  ingredientCache: {},
  nutritionCache: {}
};


const savedState = localStorage.getItem("appState");
if (savedState) {
  try {
    appState = JSON.parse(savedState);
  } catch {
    console.warn("Failed to parse saved app state.");
  }
}

function saveAppState() {
  localStorage.setItem("appState", JSON.stringify(appState));
}

// LOCAL DATABASE for when Spoonacular API fails
const localIngredientsDB = [
  // Produce
  { id: 1001, name: "Tomatoes", category: "produce", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { id: 1002, name: "Onions", category: "produce", calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  { id: 1003, name: "Garlic", category: "produce", calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  { id: 1004, name: "Lettuce", category: "produce", calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  { id: 1005, name: "Spinach", category: "produce", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { id: 1006, name: "Broccoli", category: "produce", calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { id: 1007, name: "Carrots", category: "produce", calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { id: 1008, name: "Potatoes", category: "produce", calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  { id: 1009, name: "Bell Peppers", category: "produce", calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  { id: 1010, name: "Cucumber", category: "produce", calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { id: 1011, name: "Mushrooms", category: "produce", calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  { id: 1012, name: "Apples", category: "produce", calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { id: 1013, name: "Bananas", category: "produce", calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { id: 1014, name: "Oranges", category: "produce", calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  { id: 1015, name: "Lemons", category: "produce", calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3 },
  { id: 1016, name: "Strawberries", category: "produce", calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { id: 1017, name: "Blueberries", category: "produce", calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  { id: 1018, name: "Avocado", category: "produce", calories: 160, protein: 2, carbs: 8.5, fat: 15 },
  { id: 1019, name: "Sweet Potatoes", category: "produce", calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { id: 1020, name: "Zucchini", category: "produce", calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  { id: 1021, name: "Cauliflower", category: "produce", calories: 25, protein: 1.9, carbs: 5, fat: 0.3 },
  { id: 1022, name: "Green Beans", category: "produce", calories: 31, protein: 1.8, carbs: 7, fat: 0.2 },
  { id: 1023, name: "Celery", category: "produce", calories: 16, protein: 0.7, carbs: 3, fat: 0.2 },
  { id: 1024, name: "Corn", category: "produce", calories: 86, protein: 3.3, carbs: 19, fat: 1.4 },
  { id: 1025, name: "Peas", category: "produce", calories: 81, protein: 5.4, carbs: 14, fat: 0.4 },
  
  // Dairy & Eggs
  { id: 2001, name: "Milk", category: "dairy", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { id: 2002, name: "Butter", category: "dairy", calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
  { id: 2003, name: "Cheddar Cheese", category: "dairy", calories: 403, protein: 25, carbs: 1.3, fat: 33 },
  { id: 2004, name: "Eggs", category: "dairy", calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { id: 2005, name: "Greek Yogurt", category: "dairy", calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { id: 2006, name: "Mozzarella Cheese", category: "dairy", calories: 280, protein: 28, carbs: 2.2, fat: 17 },
  { id: 2007, name: "Cream", category: "dairy", calories: 340, protein: 2.1, carbs: 2.7, fat: 37 },
  { id: 2008, name: "Parmesan Cheese", category: "dairy", calories: 431, protein: 38, carbs: 4.1, fat: 29 },
  { id: 2009, name: "Cottage Cheese", category: "dairy", calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },
  { id: 2010, name: "Sour Cream", category: "dairy", calories: 198, protein: 2.4, carbs: 4.6, fat: 19 },
  
  // Meat & Protein
  { id: 3001, name: "Chicken Breast", category: "meat", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: 3002, name: "Ground Beef", category: "meat", calories: 250, protein: 26, carbs: 0, fat: 15 },
  { id: 3003, name: "Pork Chops", category: "meat", calories: 231, protein: 25, carbs: 0, fat: 14 },
  { id: 3004, name: "Salmon", category: "meat", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: 3005, name: "Tuna", category: "meat", calories: 132, protein: 28, carbs: 0, fat: 1.3 },
  { id: 3006, name: "Shrimp", category: "meat", calories: 99, protein: 24, carbs: 0.2, fat: 0.3 },
  { id: 3007, name: "Turkey Breast", category: "meat", calories: 135, protein: 30, carbs: 0, fat: 0.7 },
  { id: 3008, name: "Bacon", category: "meat", calories: 541, protein: 37, carbs: 1.4, fat: 42 },
  { id: 3009, name: "Sausage", category: "meat", calories: 346, protein: 13, carbs: 2.2, fat: 32 },
  { id: 3010, name: "Ground Turkey", category: "meat", calories: 203, protein: 27, carbs: 0, fat: 10 },
  { id: 3011, name: "Tilapia", category: "meat", calories: 129, protein: 26, carbs: 0, fat: 2.7 },
  { id: 3012, name: "Cod", category: "meat", calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  
  // Pantry
  { id: 4001, name: "White Rice", category: "pantry", calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: 4002, name: "Brown Rice", category: "pantry", calories: 112, protein: 2.3, carbs: 24, fat: 0.9 },
  { id: 4003, name: "Pasta", category: "pantry", calories: 131, protein: 5.1, carbs: 25, fat: 1.1 },
  { id: 4004, name: "Bread", category: "pantry", calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  { id: 4005, name: "Olive Oil", category: "pantry", calories: 884, protein: 0, carbs: 0, fat: 100 },
  { id: 4006, name: "Flour", category: "pantry", calories: 364, protein: 10, carbs: 76, fat: 1 },
  { id: 4007, name: "Sugar", category: "pantry", calories: 387, protein: 0, carbs: 100, fat: 0 },
  { id: 4008, name: "Salt", category: "pantry", calories: 0, protein: 0, carbs: 0, fat: 0 },
  { id: 4009, name: "Black Beans", category: "pantry", calories: 132, protein: 8.9, carbs: 24, fat: 0.5 },
  { id: 4010, name: "Chickpeas", category: "pantry", calories: 164, protein: 8.9, carbs: 27, fat: 2.6 },
  { id: 4011, name: "Lentils", category: "pantry", calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  { id: 4012, name: "Quinoa", category: "pantry", calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { id: 4013, name: "Oats", category: "pantry", calories: 389, protein: 17, carbs: 66, fat: 6.9 },
  { id: 4014, name: "Peanut Butter", category: "pantry", calories: 588, protein: 25, carbs: 20, fat: 50 },
  { id: 4015, name: "Almonds", category: "pantry", calories: 579, protein: 21, carbs: 22, fat: 50 },
  { id: 4016, name: "Walnuts", category: "pantry", calories: 654, protein: 15, carbs: 14, fat: 65 },
  { id: 4017, name: "Soy Sauce", category: "pantry", calories: 53, protein: 5.6, carbs: 4.9, fat: 0.1 },
  { id: 4018, name: "Honey", category: "pantry", calories: 304, protein: 0.3, carbs: 82, fat: 0 },
  { id: 4019, name: "Tomato Sauce", category: "pantry", calories: 29, protein: 1.3, carbs: 6.7, fat: 0.2 },
  { id: 4020, name: "Coconut Oil", category: "pantry", calories: 862, protein: 0, carbs: 0, fat: 100 }
];

const localFoodsDB = [
  // Complete Meals
  { id: 5001, name: "Grilled Chicken Salad", calories: 350, protein: "35g", carbs: "15g", fat: "18g" },
  { id: 5002, name: "Spaghetti Bolognese", calories: 550, protein: "28g", carbs: "65g", fat: "18g" },
  { id: 5003, name: "Beef Burger", calories: 520, protein: "30g", carbs: "40g", fat: "25g" },
  { id: 5004, name: "Caesar Salad", calories: 380, protein: "15g", carbs: "12g", fat: "32g" },
  { id: 5005, name: "Chicken Stir Fry", calories: 420, protein: "32g", carbs: "45g", fat: "12g" },
  { id: 5006, name: "Salmon with Rice", calories: 480, protein: "35g", carbs: "50g", fat: "15g" },
  { id: 5007, name: "Pizza Margherita", calories: 450, protein: "18g", carbs: "55g", fat: "18g" },
  { id: 5008, name: "Vegetable Curry", calories: 320, protein: "12g", carbs: "48g", fat: "10g" },
  { id: 5009, name: "Beef Tacos", calories: 380, protein: "25g", carbs: "35g", fat: "16g" },
  { id: 5010, name: "Tuna Sandwich", calories: 340, protein: "22g", carbs: "42g", fat: "8g" },
  { id: 5011, name: "Chicken Burrito", calories: 520, protein: "30g", carbs: "58g", fat: "18g" },
  { id: 5012, name: "Greek Salad", calories: 280, protein: "12g", carbs: "15g", fat: "20g" },
  { id: 5013, name: "Pork Fried Rice", calories: 480, protein: "24g", carbs: "62g", fat: "16g" },
  { id: 5014, name: "Chicken Quesadilla", calories: 440, protein: "28g", carbs: "38g", fat: "20g" },
  { id: 5015, name: "Beef Stew", calories: 380, protein: "32g", carbs: "28g", fat: "15g" },
  { id: 5016, name: "Fish and Chips", calories: 620, protein: "28g", carbs: "68g", fat: "28g" },
  { id: 5017, name: "Chicken Wrap", calories: 420, protein: "26g", carbs: "45g", fat: "14g" },
  { id: 5018, name: "Vegetable Lasagna", calories: 380, protein: "18g", carbs: "42g", fat: "16g" },
  { id: 5019, name: "Shrimp Pasta", calories: 460, protein: "28g", carbs: "52g", fat: "14g" },
  { id: 5020, name: "BBQ Chicken", calories: 390, protein: "35g", carbs: "25g", fat: "16g" },
  { id: 5021, name: "Omelette", calories: 280, protein: "20g", carbs: "4g", fat: "20g" },
  { id: 5022, name: "Pancakes", calories: 520, protein: "12g", carbs: "78g", fat: "18g" },
  { id: 5023, name: "French Toast", calories: 480, protein: "14g", carbs: "68g", fat: "16g" },
  { id: 5024, name: "Avocado Toast", calories: 320, protein: "12g", carbs: "38g", fat: "14g" },
  { id: 5025, name: "Smoothie Bowl", calories: 380, protein: "8g", carbs: "72g", fat: "8g" }
];
const SPOONACULAR_API_KEY = '0ca96dd220c842a6bfdcddfcbcf15b5d';
const API_BASE = 'https://api.spoonacular.com';

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

let autocompleteTimeout;

async function searchIngredients(query) {
  if (query.length < 2) return [];

  if (USE_LOCAL_DATABASE) {
    const lowerQuery = query.toLowerCase();
    return localIngredientsDB.filter(item => item.name.toLowerCase().includes(lowerQuery)).slice(0, 10);
  }

  try {
    const response = await fetch(
      `${API_BASE}/food/ingredients/autocomplete?apiKey=${SPOONACULAR_API_KEY}&query=${encodeURIComponent(query)}&number=10&metaInformation=true`
    );
    
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ingredient search error:', error);
    // fallback to local if API fails
    const lowerQuery = query.toLowerCase();
    return localIngredientsDB.filter(item => item.name.toLowerCase().includes(lowerQuery)).slice(0, 10);
  }
}


async function searchFood(query) {
  if (query.length < 2) return [];

  if (USE_LOCAL_DATABASE) {
    const lowerQuery = query.toLowerCase();
    return localFoodsDB.filter(item => item.name.toLowerCase().includes(lowerQuery)).slice(0, 10);
  }

  try {
    const response = await fetch(
      `${API_BASE}/food/menuItems/search?apiKey=${SPOONACULAR_API_KEY}&query=${encodeURIComponent(query)}&number=10`
    );
    
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    return data.menuItems || [];
  } catch (error) {
    console.error('Food search error:', error);
    const lowerQuery = query.toLowerCase();
    return localFoodsDB.filter(item => item.name.toLowerCase().includes(lowerQuery)).slice(0, 10);
  }
}


async function getIngredientInfo(id) {
  if (appState.ingredientCache[id]) return appState.ingredientCache[id];

  if (USE_LOCAL_DATABASE) {
    const found = localIngredientsDB.find(i => i.id == id);
    appState.ingredientCache[id] = found || null;
    return found;
  }

  try {
    const response = await fetch(
      `${API_BASE}/food/ingredients/${id}/information?apiKey=${SPOONACULAR_API_KEY}&amount=100&unit=grams`
    );
    
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    appState.ingredientCache[id] = data;
    return data;
  } catch (error) {
    console.error('Ingredient info error:', error);
    // fallback
    const found = localIngredientsDB.find(i => i.id == id);
    appState.ingredientCache[id] = found || null;
    return found;
  }
}


async function getFoodNutrition(id) {
  if (appState.nutritionCache[id]) return appState.nutritionCache[id];

  if (USE_LOCAL_DATABASE) {
    const found = localFoodsDB.find(f => f.id == id);
    if (!found) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    const nutrition = {
      calories: found.calories,
      protein: parseFloat(found.protein) || 0,
      carbs: parseFloat(found.carbs) || 0,
      fat: parseFloat(found.fat) || 0
    };
    appState.nutritionCache[id] = nutrition;
    return nutrition;
  }

  try {
    const response = await fetch(
      `${API_BASE}/food/menuItems/${id}?apiKey=${SPOONACULAR_API_KEY}`
    );
    
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();

    const nutrition = {
      calories: data.nutrition?.calories || 0,
      protein: data.nutrition?.protein || 0,
      carbs: data.nutrition?.carbs || 0,
      fat: data.nutrition?.fat || 0
    };
    
    appState.nutritionCache[id] = nutrition;
    return nutrition;
  } catch (error) {
    console.error('Food nutrition error:', error);
    // fallback to local
    const found = localFoodsDB.find(f => f.id == id);
    if (!found) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const nutrition = {
      calories: found.calories,
      protein: parseFloat(found.protein) || 0,
      carbs: parseFloat(found.carbs) || 0,
      fat: parseFloat(found.fat) || 0
    };
    appState.nutritionCache[id] = nutrition;
    return nutrition;
  }
}

function determineCategory(ingredientName) {
  const name = ingredientName.toLowerCase();
  
  const produceKeywords = ['tomato', 'onion', 'garlic', 'lettuce', 'spinach', 'broccoli', 'carrot', 'potato', 'pepper', 'cucumber', 'mushroom', 'apple', 'banana', 'orange', 'lemon', 'lime', 'berry', 'vegetable', 'fruit'];
  const dairyKeywords = ['milk', 'butter', 'cheese', 'egg', 'yogurt', 'cream', 'dairy'];
  const meatKeywords = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'turkey', 'meat', 'bacon', 'sausage'];
  const pantryKeywords = ['flour', 'rice', 'pasta', 'bread', 'oil', 'salt', 'sugar', 'sauce', 'spice', 'vinegar', 'bean', 'lentil'];
  
  if (produceKeywords.some(kw => name.includes(kw))) return 'produce';
  if (dairyKeywords.some(kw => name.includes(kw))) return 'dairy';
  if (meatKeywords.some(kw => name.includes(kw))) return 'meat';
  if (pantryKeywords.some(kw => name.includes(kw))) return 'pantry';
  
  return 'other';
}

function setupAutocomplete(inputId, resultsId, searchFn, selectFn) {
  const input = document.getElementById(inputId);
  const results = document.getElementById(resultsId);
  
  input.addEventListener('input', async (e) => {
    clearTimeout(autocompleteTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
      results.style.display = 'none';
      return;
    }
    
    autocompleteTimeout = setTimeout(async () => {
      const items = await searchFn(query);
      
      if (items.length === 0) {
        results.innerHTML = '<div class="autocomplete-item text-muted">No results found</div>';
        results.style.display = 'block';
        return;
      }
      
      results.innerHTML = items.map(item => 
        `<div class="autocomplete-item" data-id="${item.id}" data-name="${item.name || item.title}">${item.name || item.title}</div>`
      ).join('');
      results.style.display = 'block';
      
      results.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
          selectFn(item.dataset.id, item.dataset.name);
          input.value = item.dataset.name;
          results.style.display = 'none';
        });
      });
    }, 300);
  });
  
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      results.style.display = 'none';
    }
  });
}

// SHOPPING LIST FUNCTIONS
let selectedIngredient = null;

function selectIngredient(id, name) {
  selectedIngredient = { id, name };
}

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
  saveAppState();
}

window.toggleShoppingItem = function(id) {
  const item = appState.shoppingList.find(i => i.id === id);
  if (item) {
    item.checked = !item.checked;
    renderShoppingList();
  }
  saveAppState();
};

window.removeShoppingItem = function(id) {
  appState.shoppingList = appState.shoppingList.filter(i => i.id !== id);
  renderShoppingList();
  saveAppState();
};

async function addShoppingItem(e) {
  e.preventDefault();
  
  if (!selectedIngredient) {
    alert('Please select a valid ingredient from the suggestions');
    return;
  }
  
  const qty = parseFloat(document.getElementById('shopping-item-qty').value);
  const unit = document.getElementById('shopping-item-unit').value;
  
  if (qty <= 0) {
    alert('Please enter a valid quantity');
    return;
  }
  
  const btnText = document.getElementById('add-btn-text');
  const btnSpinner = document.getElementById('add-btn-spinner');
  
  btnText.style.display = 'none';
  btnSpinner.style.display = 'inline-block';
  
  try {
    const category = determineCategory(selectedIngredient.name);
    
    appState.shoppingList.push({
      id: Date.now(),
      spoonacularId: selectedIngredient.id,
      name: selectedIngredient.name,
      qty,
      unit,
      category,
      checked: false
    });
    
    renderShoppingList();
    document.getElementById('shopping-add-form').reset();
    selectedIngredient = null;
  } finally {
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
  }
  saveAppState();
}

function clearShoppingList() {
  if (confirm('Clear all items from shopping list?')) {
    appState.shoppingList = [];
    renderShoppingList();
  }
}

// NUTRITION TRACKING FUNCTIONS
let selectedFood = null;

function selectFood(id, name) {
  selectedFood = { id, name };
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

  document.getElementById('cal-value').textContent = Math.round(totals.calories);
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
  saveAppState();
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
            ${Math.round(meal.calories)} cal | ${meal.protein.toFixed(1)}g protein | ${meal.carbs.toFixed(1)}g carbs | ${meal.fat.toFixed(1)}g fat
          </div>
          <div class="small text-muted">Servings: ${meal.servings}</div>
        </div>
        <button class="btn btn-sm btn-outline-danger" onclick="removeMeal(${meal.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    display.appendChild(div);
  });
}

window.removeMeal = function(id) {
  appState.loggedMeals = appState.loggedMeals.filter(m => m.id !== id);
  renderLoggedMeals();
  updateNutritionDisplay();
  saveAppState();
};

async function addMeal(e) {
  e.preventDefault();

  if (!selectedFood) {
    alert('Please select a valid food/meal from the suggestions');
    return;
  }

  const servings = parseFloat(document.getElementById('meal-servings').value);

  if (servings <= 0) {
    alert('Please enter a valid number of servings');
    return;
  }

  const btnText = document.getElementById('log-btn-text');
  const btnSpinner = document.getElementById('log-btn-spinner');
  
  btnText.style.display = 'none';
  btnSpinner.style.display = 'inline-block';

  try {
    const nutrition = await getFoodNutrition(selectedFood.id);
    
    appState.loggedMeals.push({
      id: Date.now(),
      spoonacularId: selectedFood.id,
      name: selectedFood.name,
      servings,
      calories: nutrition.calories * servings,
      protein: parseFloat(String(nutrition.protein).replace('g', '').trim()) * servings,
      carbs: parseFloat(String(nutrition.carbs).replace('g', '').trim()) * servings,
      fat: parseFloat(String(nutrition.fat).replace('g', '').trim()) * servings,
      timestamp: new Date().toISOString()
    });

    renderLoggedMeals();
    updateNutritionDisplay();
    document.getElementById('nutrition-log-form').reset();
    selectedFood = null;
  } catch (error) {
    alert('Failed to log meal. Please try again.');
    console.error(error);
  } finally {
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
    saveAppState();
  }
}

// CHARTS INITIALIZATION
function initCharts() {
  const totals = getTodaysTotal();
  const goals = appState.nutritionGoals;

  const macroCtx = document.getElementById('macroChart').getContext('2d');
  window.macroChart = new Chart(macroCtx, {
    type: 'doughnut',
    data: {
      labels: ['Protein', 'Carbs', 'Fat'],
      datasets: [{
        data: [totals.protein || 1, totals.carbs || 1, totals.fat || 1],
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

// EVENT LISTENERS
function attachEventListeners() {
  document.getElementById('shopping-add-form').addEventListener('submit', addShoppingItem);
  document.getElementById('nutrition-log-form').addEventListener('submit', addMeal);
  document.getElementById('clear-list-btn').addEventListener('click', clearShoppingList);
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  renderShoppingList();
  renderLoggedMeals();
  initCharts();
  updateNutritionDisplay();
  attachEventListeners();
  
  setupAutocomplete('shopping-item-name', 'shopping-autocomplete', searchIngredients, selectIngredient);
  setupAutocomplete('meal-name', 'meal-autocomplete', searchFood, selectFood);
});