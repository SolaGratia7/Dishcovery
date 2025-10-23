/**
 * Utility functions for normalizing, consolidating, and grouping recipe ingredients
 * used by ShoppingGen.vue.
 */

import { IngredientCategorizer } from '@/utils/IngredientsCategorizer.js';

/* ---------------------- 1. Name Normalization ---------------------- */

export function normalizeIngredientName(name) {
  let normalized = name?.toLowerCase().trim() || '';

  // Remove numbers, special chars, and measurements
  normalized = normalized.replace(/^[0-9.\s]+/, '');
  normalized = normalized.replace(
    /\d+\.?\d*\s*(oz|lb|g|kg|ml|l|tsp|tbsp|cup|c)\s*\.?\s*x?\s*/gi,
    ''
  );

  // Descriptors to strip
  const removeWords = [
    'fresh','dried','frozen','canned','organic','raw','cooked',
    'extra virgin','virgin','pure','quality','chopped','diced',
    'sliced','minced','crushed','grated','shredded','whole','ground',
    'crumbled','large','small','medium','baby','jumbo','red','green',
    'yellow','white','black','brown','purple','unsalted','salted',
    'sweetened','unsweetened','low fat','fat free','full fat','skim','2%',
    'packed','firmly','lightly','loosely','to taste','or more','about',
    'approximately','boneless','skinless','bone-in','optional','for serving',
    'for garnish','uncooked','pre-cooked'
  ];
  removeWords.forEach(w => {
    const regex = new RegExp(`\\b${w}\\b`, 'gi');
    normalized = normalized.replace(regex, '');
  });

  // Remove parentheses and trim spaces
  normalized = normalized.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

  /* ---------------- special case exclusions ---------------- */
  const specialCases = [
    'peanut butter', 'almond butter', 'cashew butter', 'nut butter'
  ];
  for (const s of specialCases) {
    if (normalized.includes(s)) return s;
  }

  /* ---------------- singular-plural harmonizer ---------------- */
  const pluralExceptions = [
    'beans', 'peas', 'greens', 'noodles', 'chips', 'oats', 'cornflakes'
  ];

  function toSingular(word) {
    if (pluralExceptions.includes(word)) return word;
    if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
    if (word.endsWith('oes')) return word.slice(0, -2);
    if (word.endsWith('es')) return word.slice(0, -2);
    if (word.endsWith('s')) return word.slice(0, -1);
    return word;
  }

  // Handle simple plural normalization
  const words = normalized.split(' ');
  normalized = words.map(toSingular).join(' ').trim();

  /* ---------------- fuzzy group consolidations ---------------- */
  const groups = [
    { key: 'avocado',   target: 'avocado' },
    { key: 'bacon',     target: 'bacon' },
    { key: 'banana',    target: 'banana' },
    { key: 'bread',     target: 'bread' },
    { key: 'broth',     target: 'broth' },
    { key: 'butter',    target: 'butter', exclude: ['peanut butter'] },
    { key: 'carrot',    target: 'carrot' },
    { key: 'cheese',    target: 'cheese' },
    { key: 'chicken breast', target: 'chicken breast' },
    { key: 'chicken thigh',  target: 'chicken thigh' },    
    { key: 'chicken',   target: 'chicken', exclude: ['chicken thigh', 'chicken breast'] },
    { key: 'corn',      target: 'corn' },
    { key: 'cream',     target: 'cream' },
    { key: 'egg',       target: 'egg' },
    { key: 'flour',     target: 'flour' },
    { key: 'garlic',    target: 'garlic' },
    { key: 'honey',     target: 'honey' },
    { key: 'lemon',     target: 'lemon' },
    { key: 'lime',      target: 'lime' },
    { key: 'mayonnaise',target: 'mayonnaise' },
    { key: 'milk',      target: 'milk' },
    { key: 'mushroom',  target: 'mushroom' },
    { key: 'mustard',   target: 'mustard' },
    { key: 'noodle',    target: 'noodle' },
    { key: 'nut',       target: 'nut' },
    { key: 'oats',      target: 'oats' },
    { key: 'oil',       target: 'oil' },
    { key: 'onion',     target: 'onion' },
    { key: 'pasta',     target: 'pasta' },
    { key: 'pepper',    target: 'pepper' },
    { key: 'potato',    target: 'potato' },
    { key: 'rice',      target: 'rice' },
    { key: 'salt',      target: 'salt' },
    { key: 'seed',      target: 'seed' },
    { key: 'sugar',     target: 'sugar' },
    { key: 'tomato',    target: 'tomato' },
    { key: 'vanilla',   target: 'vanilla' },
    { key: 'vinegar',   target: 'vinegar' },
    { key: 'wine',      target: 'wine' },
    { key: 'yogurt',    target: 'yogurt' }
  ];

  for (const g of groups) {
    if (normalized.includes(g.key)) {
      if (g.exclude?.some(ex => normalized.includes(ex))) continue;
      return g.target;
    }
  }

  /* ---------------- alias-based consolidations ---------------- */
  const consolidations = {
    'olive oil': 'oil','vegetable oil': 'oil','canola oil': 'oil',
    'balsamic vinegar': 'vinegar','apple cider vinegar': 'vinegar',
    'basmati rice': 'rice','brown rice': 'rice','white rice': 'rice',
    'corn tortilla': 'corn','tortilla': 'corn','sweet potato': 'potato',
    'cherry tomato': 'tomato','roma tomato': 'tomato','grape tomato': 'tomato',
    'mozzarella': 'cheese','cheddar': 'cheese','feta': 'cheese','parmesan': 'cheese'
  };

  for (const [key, val] of Object.entries(consolidations)) {
    if (normalized.includes(key)) return val;
  }

  if (normalized.includes('chocolate') && normalized.includes('cocoa')) {
    return 'chocolate cocoa';           // e.g. "Chocolate 75%% cocoa"
  }
  if (normalized.includes('chocolate') || normalized.includes('cocoa')) {
    return 'chocolate';                 // e.g. "Cocoa nib", "Semi chocolate chips"
  }  

  /* ---------------- cleanup of invalid placeholders ---------------- */
  // Remove items that are just slashes, dashes, or blank
  if (/^[/\\\-\s]*$/.test(normalized)) {
    return '';
  }

  return normalized;
}



/* ---------------------- 2. Unit Normalization ---------------------- */

const UNIT_CONVERSIONS = {
  volume: {
    cup: 240, cups: 240, c: 240,
    tablespoon: 15, tablespoons: 15, tbsp: 15, tbs: 15,
    teaspoon: 5, teaspoons: 5, tsp: 5,
    ml: 1, milliliter: 1, milliliters: 1,
    liter: 1000, liters: 1000, l: 1000,
    'fl oz': 30, 'fluid ounce': 30, 'fluid ounces': 30,
    pint: 473, pints: 473, quart: 946, quarts: 946, gallon: 3785
  },
  weight: {
    g: 1, gram: 1, grams: 1,
    kg: 1000, kilogram: 1000, kilograms: 1000,
    oz: 28.35, ounce: 28.35, ounces: 28.35,
    lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592
  }
};

export function normalizeUnit(amount, unit) {
  if (!unit) return { amount, unit: 'piece', type: 'count' };
  const u = unit.toLowerCase().trim();

  // Volume
  if (UNIT_CONVERSIONS.volume[u]) {
    const ml = amount * UNIT_CONVERSIONS.volume[u];
    return { amount: ml >= 1000 ? ml / 1000 : ml, unit: ml >= 1000 ? 'liter' : 'ml', type: 'volume' };
  }

  // Weight
  if (UNIT_CONVERSIONS.weight[u]) {
    const g = amount * UNIT_CONVERSIONS.weight[u];
    return { amount: g >= 1000 ? g / 1000 : g, unit: g >= 1000 ? 'kg' : 'g', type: 'weight' };
  }

  // Count-based units
  const countUnits = ['piece', 'pieces', 'clove', 'can', 'bag', 'box', 'slice', 'stick', 'leaf', 'bunch', 'seed'];
  if (countUnits.some(c => u.includes(c))) {
    return { amount, unit: 'piece', type: 'count' };
  }

  return { amount, unit, type: 'count' };
}

/* ---------------------- 3. Unit Type Logic ---------------------- */

export function getPreferredUnitType(name) {
  const n = name.toLowerCase();
  const liquids = ['oil', 'milk', 'cream', 'broth', 'stock', 'juice', 'sauce', 'vinegar', 'syrup', 'honey'];
  const solids = ['meat', 'chicken', 'cheese', 'flour', 'sugar', 'beans', 'rice', 'pasta'];
  const spices = ['salt', 'pepper', 'cinnamon', 'paprika', 'powder', 'seed'];
  const produce = ['apple', 'banana', 'lemon', 'onion', 'tomato', 'carrot', 'potato'];

  if (liquids.some(w => n.includes(w))) return 'volume';
  if (solids.some(w => n.includes(w))) return 'weight';
  if (spices.some(w => n.includes(w))) return 'volume';
  if (produce.some(w => n.includes(w))) return 'count';
  return 'count';
}

/* ---------------------- 4. Count-to-Weight/Volume Estimates ---------------------- */

function estimateFromCount(count, name, targetType) {
  const n = name.toLowerCase();
  const estimates = {
    tomato: { type: 'weight', perItem: 150, unit: 'g' },
    onion: { type: 'weight', perItem: 150, unit: 'g' },
    garlic: { type: 'weight', perItem: 5, unit: 'g' },
    carrot: { type: 'weight', perItem: 60, unit: 'g' },
    potato: { type: 'weight', perItem: 200, unit: 'g' },
    apple: { type: 'weight', perItem: 180, unit: 'g' },
    lemon: { type: 'weight', perItem: 60, unit: 'g' },
    egg: { type: 'weight', perItem: 50, unit: 'g' },
    can: { type: 'weight', perItem: 400, unit: 'g' },
    bag: { type: 'weight', perItem: 500, unit: 'g' }
  };
  for (const [key, val] of Object.entries(estimates)) {
    if (n.includes(key) && val.type === targetType) {
      const total = count * val.perItem;
      return { amount: total >= 1000 ? total / 1000 : total, unit: total >= 1000 ? 'kg' : val.unit, type: val.type };
    }
  }
  return null;
}

/* ---------------------- 5. Main Grouping Function ---------------------- */

export function groupAndNormalizeIngredients(ingredients) {
  const grouped = {};

  ingredients.forEach(i => {
    const name = normalizeIngredientName(i.name);
    const amt = parseFloat(i.amount) || 1;
    const unit = i.unit || 'piece';
    const normalized = normalizeUnit(amt, unit);
    const preferredType = getPreferredUnitType(name);

    if (!grouped[name]) {
      let amount = normalized.amount, unitOut = normalized.unit, typeOut = normalized.type;
      if (typeOut === 'count' && preferredType !== 'count') {
        const est = estimateFromCount(amount, name, preferredType);
        if (est) ({ amount, unitOut, typeOut } = est);
      }
      grouped[name] = { name, amount, unit: unitOut, type: typeOut };
    } else {
      const existing = grouped[name];
      if (existing.type === normalized.type) existing.amount += normalized.amount;
      else {
        const est = estimateFromCount(normalized.amount, name, existing.type);
        existing.amount += est ? est.amount : normalized.amount;
      }
    }
  });

  return Object.values(grouped).map(item => ({
    ...item,
    category: IngredientCategorizer.categorizeIngredient(item.name)
  }));
}
