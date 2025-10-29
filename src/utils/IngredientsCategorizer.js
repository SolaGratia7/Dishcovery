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
      'strawberry', 'blueberry', 'raspberry', 'cherry', 'plum', 'kiwi', 'papaya',
      'asparagus', 'beetroot', 'radish', 'brussels sprout', 'sweet potato',
      'artichoke', 'leek', 'pumpkin', 'butternut squash', 'ginger root'
    ])) return 'Produce';

    // Proteins
    if (IngredientCategorizer.isInCategory(name, [
      'chicken', 'beef', 'pork', 'turkey', 'lamb', 'fish', 'salmon',
      'tuna', 'shrimp', 'prawn', 'meat', 'steak', 'bacon', 'sausage',
      'tofu', 'tempeh', 'egg', 'eggs', 'squid', 'squids',
      'duck', 'crab', 'lobster', 'clams', 'mussels', 'scallops',
      'anchovy', 'ham', 'venison', 'goat', 'oyster', 'cod', 'trout',
      'mackerel', 'sardine', 'octopus'
    ])) return 'Proteins';

    // Dairy
    if (IngredientCategorizer.isInCategory(name, [
      'milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream',
      'mozzarella', 'cheddar', 'parmesan', 'feta', 'ricotta', 'yoghurt',
      'whipping cream', 'condensed milk', 'evaporated milk', 'ice cream',
      'cream cheese', 'buttermilk', 'ghee', 'custard', 'paneer', 'brie',
      'camembert', 'goat cheese', 'milk powder'
    ])) return 'Dairy';

    // Grains & Bread
    if (IngredientCategorizer.isInCategory(name, [
      'bread', 'rice', 'pasta', 'noodle', 'flour', 'oat', 'quinoa',
      'barley', 'couscous', 'tortilla', 'pita', 'bagel', 'cereal',
      'spaghetti', 'macaroni', 'lasagna', 'vermicelli', 'udon', 'soba',
      'ramen', 'brown rice', 'white rice', 'wild rice', 'brioche',
      'croissant', 'wrap', 'biscuit', 'scone', 'cracker'
    ])) return 'Grains & Bread';

    // Pantry Staples
    if (IngredientCategorizer.isInCategory(name, [
      'oil', 'olive oil', 'vegetable oil', 'vinegar', 'soy sauce',
      'salt', 'pepper', 'sugar', 'honey', 'maple syrup', 'stock',
      'broth', 'sauce', 'ketchup', 'mustard', 'mayonnaise',
      'hot sauce', 'barbecue sauce', 'coconut milk', 'peanut butter',
      'jam', 'jelly', 'miso', 'sesame oil', 'fish sauce', 'worcestershire sauce',
      'cornstarch', 'baking powder', 'baking soda', 'yeast', 'molasses'
    ])) return 'Pantry Staples';

    // Spices & Herbs
    if (IngredientCategorizer.isInCategory(name, [
      'basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro',
      'cumin', 'paprika', 'cinnamon', 'ginger', 'turmeric', 'curry',
      'chili', 'cayenne', 'nutmeg', 'vanilla', 'mint', 'dill',
      'bay leaf', 'cardamom', 'clove', 'sage', 'fennel', 'star anise',
      'black peppercorn', 'white pepper', 'garlic powder', 'onion powder',
      'five spice', 'allspice', 'lemongrass'
    ])) return 'Spices & Herbs';

    // Canned & Jarred
    if (IngredientCategorizer.isInCategory(name, [
      'canned', 'can', 'jar', 'jarred', 'tomato paste', 'tomato sauce',
      'beans', 'chickpea', 'lentil', 'corn', 'peas', 'pickle',
      'baked beans', 'sardines', 'tuna can', 'anchovies', 'coconut cream',
      'olives', 'capers', 'artichoke hearts', 'fruit cocktail', 'jam',
      'jelly', 'marmalade', 'pesto', 'kimchi', 'sauerkraut', 'spam'
    ])) return 'Canned & Jarred';

    // Beverages
    if (IngredientCategorizer.isInCategory(name, [
      'water', 'juice', 'soda', 'coffee', 'tea', 'wine', 'beer', 'drink',
      'milkshake', 'smoothie', 'energy drink', 'iced tea', 'lemonade',
      'coconut water', 'sparkling water', 'whiskey', 'vodka', 'rum',
      'cocktail', 'mocktail', 'espresso', 'latte', 'mocha', 'hot chocolate'
    ])) return 'Beverages';

    // Snacks
    if (IngredientCategorizer.isInCategory(name, [
      'chip', 'chips', 'cracker', 'cookie', 'chocolate', 'candy',
      'popcorn', 'pretzel', 'nut', 'nuts', 'almond', 'cashew', 'peanut',
      'granola bar', 'trail mix', 'gummy', 'biscuit', 'wafer', 'brownie',
      'muffin', 'cupcake', 'rice cake', 'jerky', 'fruit snack', 'energy bar',
      'nacho', 'puff', 'doughnut', 'marshmallow', 'pastry'
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
