const SPOONACULAR_API_KEY = '0ca96dd220c842a6bfdcddfcbcf15b5d';
const NUTRITION_CACHE_KEY = 'nutritionCache';

async function fetchRecipeNutrition(recipeId) {
  try {
    // check cache first
    const cache = JSON.parse(localStorage.getItem(NUTRITION_CACHE_KEY) || '{}');
    if (cache[recipeId]) {
      return cache[recipeId];
    }

    const response = await fetch(
      `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}&addRecipeInformation=true`
    );

    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();

    const nutrition = {
      id: recipeId,
      title: data.title,
      calories: Math.round(
        data.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 0
      ),
      protein: Math.round(
        data.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0
      ),
      carbs: Math.round(
        data.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0
      ),
      fat: Math.round(
        data.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0
      ),
      ingredients: data.extendedIngredients || []
    };

    cache[recipeId] = nutrition;
    localStorage.setItem(NUTRITION_CACHE_KEY, JSON.stringify(cache));

    return nutrition;
  } catch (error) {
    console.error('Nutrition API error:', error);
    return {
      id: recipeId,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      ingredients: []
    };
  }
}

async function autoGenerateShoppingList(mealPlans, savedRecipes) {
  const ingredients = {};

  const ingredientMap = {
    'tomato': 'produce',
    'onion': 'produce',
    'garlic': 'produce',
    'lettuce': 'produce',
    'spinach': 'produce',
    'broccoli': 'produce',
    'carrot': 'produce',
    'potato': 'produce',
    'bell pepper': 'produce',
    'cucumber': 'produce',
    'mushroom': 'produce',
    'apple': 'produce',
    'banana': 'produce',
    'orange': 'produce',
    'lemon': 'produce',
    'lime': 'produce',

    'milk': 'dairy',
    'butter': 'dairy',
    'cheese': 'dairy',
    'egg': 'dairy',
    'yogurt': 'dairy',
    'cream': 'dairy',

    'chicken': 'meat',
    'beef': 'meat',
    'pork': 'meat',
    'fish': 'meat',
    'salmon': 'meat',
    'tuna': 'meat',
    'shrimp': 'meat',
    'turkey': 'meat',

    'flour': 'pantry',
    'rice': 'pantry',
    'pasta': 'pantry',
    'bread': 'pantry',
    'oil': 'pantry',
    'salt': 'pantry',
    'sugar': 'pantry',
    'sauce': 'pantry',
    'spice': 'pantry',
    'vinegar': 'pantry'
  };

  for (const dateStr in mealPlans) {
    const dayMeals = mealPlans[dateStr];

    for (const mealType in dayMeals) {
      const meal = dayMeals[mealType];

      if (meal && meal.id) {
        const recipe = savedRecipes.find(r => Number(r.id) === Number(meal.id));

        if (recipe) {
          try {
            // fetch nutrition
            const nutrition = await fetchRecipeNutrition(recipe.id);

            if (nutrition.ingredients && Array.isArray(nutrition.ingredients)) {
              nutrition.ingredients.forEach(ing => {
                const name = ing.name || ing.original || '';
                const key = name.toLowerCase();

                // determine category
                let category = 'other';
                for (const [keyword, cat] of Object.entries(ingredientMap)) {
                  if (key.includes(keyword)) {
                    category = cat;
                    break;
                  }
                }

                // aggregate quantity
                if (ingredients[key]) {
                  ingredients[key].qty += ing.amount || 1;
                } else {
                  ingredients[key] = {
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    qty: ing.amount || 1,
                    unit: ing.unit || 'pieces',
                    category: category,
                    id: Date.now() + Math.random()
                  };
                }
              });
            }
          } catch (e) {
            console.warn(`Could not fetch nutrition for recipe ${recipe.id}:`, e);
          }
        }
      }
    }
  }

  return Object.values(ingredients);
}

async function calculateWeeklyNutrition(mealPlans, savedRecipes) {
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    servings: 0,
    meals: []
  };

  for (const dateStr in mealPlans) {
    const dayMeals = mealPlans[dateStr];

    for (const mealType in dayMeals) {
      const meal = dayMeals[mealType];

      if (meal && meal.id) {
        const recipe = savedRecipes.find(r => Number(r.id) === Number(meal.id));

        if (recipe) {
          try {
            const nutrition = await fetchRecipeNutrition(recipe.id);
            totals.calories += nutrition.calories || 0;
            totals.protein += nutrition.protein || 0;
            totals.carbs += nutrition.carbs || 0;
            totals.fat += nutrition.fat || 0;
            totals.meals.push({
              date: dateStr,
              type: mealType,
              title: recipe.title,
              nutrition
            });
          } catch (e) {
            console.warn('Error calculating nutrition:', e);
          }
        }
      }
    }
  }

  return totals;
}

function logMealToNutrition(recipeTitle, nutrition, servings = 1) {
  try {
    let data = JSON.parse(
      localStorage.getItem('dishcoveryData') || '{}'
    );

    if (!data.loggedMeals) data.loggedMeals = [];

    const logEntry = {
      id: Date.now(),
      name: recipeTitle,
      calories: Math.round((nutrition.calories || 0) * servings),
      protein: Math.round((nutrition.protein || 0) * servings),
      carbs: Math.round((nutrition.carbs || 0) * servings),
      fat: Math.round((nutrition.fat || 0) * servings),
      timestamp: new Date().toISOString()
    };

    data.loggedMeals.push(logEntry);
    localStorage.setItem('dishcoveryData', JSON.stringify(data));

    return logEntry;
  } catch (e) {
    console.error('Failed to log meal:', e);
    return null;
  }
}

function getMealPlanningData() {
  try {
    const data = JSON.parse(
      localStorage.getItem('recipeFinderData') || '{}'
    );
    return {
      mealPlans: data.mealPlans || {},
      savedRecipes: data.savedRecipes || []
    };
  } catch (e) {
    console.error('Failed to access meal planning data:', e);
    return {
      mealPlans: {},
      savedRecipes: []
    };
  }
}

function getShoppingListData() {
  try {
    const data = JSON.parse(
      localStorage.getItem('dishcoveryData') || '{}'
    );
    return data.shoppingList || [];
  } catch (e) {
    console.error('Failed to access shopping data:', e);
    return [];
  }
}

function getWeeklySummary() {
  try {
    const data = JSON.parse(
      localStorage.getItem('dishcoveryData') || '{}'
    );
    const meals = data.loggedMeals || [];

    if (meals.length === 0) {
      return {
        total: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        average: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        daysLogged: 0
      };
    }

    const total = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const daysLogged = new Set(
      meals.map(m => new Date(m.timestamp).toDateString())
    ).size;

    return {
      total,
      average: {
        calories: Math.round(total.calories / daysLogged),
        protein: Math.round(total.protein / daysLogged),
        carbs: Math.round(total.carbs / daysLogged),
        fat: Math.round(total.fat / daysLogged)
      },
      daysLogged
    };
  } catch (e) {
    console.error('Failed to get weekly summary:', e);
    return null;
  }
}

// CLEAR CAHE

function clearNutritionCache() {
  try {
    localStorage.removeItem(NUTRITION_CACHE_KEY);
    console.log('Nutrition cache cleared');
  } catch (e) {
    console.error('Failed to clear cache:', e);
  }
}