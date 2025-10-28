// IngredientCategorizer.js
export const IngredientCategorizer = {
  /**
   * Determines the category of an ingredient based on keywords
   * @param {string} ingredientName - The name of the ingredient
   * @returns {string} - The category name
   */
  categorizeIngredient(ingredientName) {
    if (!ingredientName) return 'Other';
    const name = ingredientName.toLowerCase();

    // Produce
    if (IngredientCategorizer.isInCategory(name, [
      'lettuce', 'tomato', 'cucumber', 'carrot', 'onion', 'garlic', 'potato',
      'bell pepper', 'pepper', 'broccoli', 'spinach', 'kale', 'celery',
      'mushroom', 'zucchini', 'eggplant', 'cabbage', 'cauliflower',
      'apple', 'banana', 'orange', 'lemon', 'lime', 'berry', 'berries',
      'grape', 'melon', 'mango', 'pineapple', 'avocado', 'peach', 'pear', 'watermelon',
    ])) return 'Produce';

    // Proteins
    if (IngredientCategorizer.isInCategory(name, [
      'chicken', 'beef', 'pork', 'turkey', 'lamb', 'fish', 'salmon',
      'tuna', 'shrimp', 'prawn', 'meat', 'steak', 'bacon', 'sausage',
      'tofu', 'tempeh', 'egg', 'eggs'
    ])) return 'Proteins';

    // Dairy
    if (IngredientCategorizer.isInCategory(name, [
      'milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream',
      'mozzarella', 'cheddar', 'parmesan', 'feta', 'ricotta', 'yoghurt',
    ])) return 'Dairy';

    // Grains & Bread
    if (IngredientCategorizer.isInCategory(name, [
      'bread', 'rice', 'pasta', 'noodle', 'flour', 'oat', 'quinoa',
      'barley', 'couscous', 'tortilla', 'pita', 'bagel', 'cereal'
    ])) return 'Grains & Bread';

    // Pantry Staples
    if (IngredientCategorizer.isInCategory(name, [
      'oil', 'olive oil', 'vegetable oil', 'vinegar', 'soy sauce',
      'salt', 'pepper', 'sugar', 'honey', 'maple syrup', 'stock',
      'broth', 'sauce', 'ketchup', 'mustard', 'mayonnaise'
    ])) return 'Pantry Staples';

    // Spices & Herbs
    if (IngredientCategorizer.isInCategory(name, [
      'basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro',
      'cumin', 'paprika', 'cinnamon', 'ginger', 'turmeric', 'curry',
      'chili', 'cayenne', 'nutmeg', 'vanilla', 'mint', 'dill'
    ])) return 'Spices & Herbs';

    // Canned & Jarred
    if (IngredientCategorizer.isInCategory(name, [
      'canned', 'can', 'jar', 'jarred', 'tomato paste', 'tomato sauce',
      'beans', 'chickpea', 'lentil', 'corn', 'peas', 'pickle'
    ])) return 'Canned & Jarred';

    // Beverages
    if (IngredientCategorizer.isInCategory(name, [
      'water', 'juice', 'soda', 'coffee', 'tea', 'wine', 'beer', 'drink'
    ])) return 'Beverages';

    // Snacks
    if (IngredientCategorizer.isInCategory(name, [
      'chip', 'chips', 'cracker', 'cookie', 'chocolate', 'candy',
      'popcorn', 'pretzel', 'nut', 'nuts', 'almond', 'cashew', 'peanut'
    ])) return 'Snacks';

    return 'Others';
  },

  /**
   * Helper method to check if ingredient name contains any of the keywords
   * @param {string} name - The ingredient name (lowercase)
   * @param {Array} keywords - Array of keyword strings to check
   * @returns {boolean}
   */
  isInCategory(name, keywords) {
    return keywords.some(keyword => name.includes(keyword));
  },

  /**
   * Categorizes an array of ingredients and assigns categories
   * @param {Array} ingredients - Array of ingredient objects with 'name' property
   * @returns {Array} - Array of ingredient objects with added `category` property
   */
  categorizeIngredients(ingredients) {
    return ingredients.map(ingredient => ({
      ...ingredient,
      category: IngredientCategorizer.categorizeIngredient(ingredient.name)
    }));
  },

  /**
   * Groups ingredients into categories
   * @param {Array} ingredients
   * @returns {Object} - { CategoryName: [ingredients...] }
   */
  groupByCategory(ingredients) {
    const categorized = {};
    ingredients.forEach(ingredient => {
      const category = IngredientCategorizer.categorizeIngredient(ingredient.name);
      if (!categorized[category]) categorized[category] = [];
      categorized[category].push(ingredient);
    });
    return categorized;
  },

  /**
   * Gets all available categories
   * @returns {Array} - Array of category names
   */
  getCategories() {
    return [
      'Produce',
      'Proteins',
      'Dairy',
      'Grains & Bread',
      'Pantry Staples',
      'Spices & Herbs',
      'Canned & Jarred',
      'Beverages',
      'Snacks',
      'Others'
    ];
  }
};
