<template>
  <div class="nutrition-tracker">
    <div class="tracker-layout">
      <!-- Calendar Sidebar -->
      <div class="calendar-sidebar">
        <div class="calendar-section">
          <div class="calendar-dropdown">
            <div class="calendar-header">
              <h6>View Nutrition History</h6>
                <small class="text-muted">Choose from a highlighted date to view that day's nutrition data</small>
            </div>
            <div class="selected-date-display">
              <small class="text-muted">Selected: {{ formatDisplayDate(selectedDate) }}</small>
            </div>
            <div class="calendar-container">
              <MiniCalendar
                :currentWeek="selectedDate"
                :selectedDates="[selectedDateStr]"
                :datesWithMeals="datesWithMeals"
                mode="single"
                :highlight-selected="true"
                :autoClose="false"
                @select-date="onDateSelect"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <h2 class="mb-4">Nutrition Tracking</h2>

        <!-- Nutrition Goals Section -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="nutrition-card fade-in">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">Daily Nutrition Goals</h5>
                <button 
                  class="btn btn-primary btn-sm"
                  @click="showGoalsModal = true"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit Goals
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Nutrition Progress Circles -->
        <div class="row mb-4">
          <div class="col-6 col-md-3 mb-3 mb-md-0">
            <div class="nutrition-card fade-in">
              <div class="progress-circle pc-calories">
                <span id="cal-display">{{ calPct }}%</span>
              </div>
              <div class="nutrition-stat">
                <div class="stat-value">{{ Math.round(totals.calories) }}</div>
                <div class="stat-label">/ {{ goals.calories }} cal</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3 mb-3 mb-md-0">
            <div class="nutrition-card fade-in">
              <div class="progress-circle pc-protein">
                <span>{{ protPct }}%</span>
              </div>
              <div class="nutrition-stat">
                <div class="stat-value">{{ totals.protein.toFixed(1) }}g</div>
                <div class="stat-label">/ {{ goals.protein }}g protein</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3 mb-3 mb-md-0">
            <div class="nutrition-card fade-in">
              <div class="progress-circle pc-carbs">
                <span>{{ carbPct }}%</span>
              </div>
              <div class="nutrition-stat">
                <div class="stat-value">{{ totals.carbs.toFixed(1) }}g</div>
                <div class="stat-label">/ {{ goals.carbs }}g carbs</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3 mb-3 mb-md-0">
            <div class="nutrition-card fade-in">
              <div class="progress-circle pc-fat">
                <span>{{ fatPct }}%</span>
              </div>
              <div class="nutrition-stat">
                <div class="stat-value">{{ totals.fat.toFixed(1) }}g</div>
                <div class="stat-label">/ {{ goals.fat }}g fat</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="row mb-4">
          <div class="col-lg-6">
            <div class="nutrition-card fade-in">
              <h5 class="mb-3">Macro Breakdown</h5>
              <div class="chart-container">
                <canvas ref="macroChartCanvas"></canvas>
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="nutrition-card fade-in">
              <h5 class="mb-3">Daily Progress</h5>
              <div class="chart-container">
                <canvas ref="progressChartCanvas"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Log Meal Form -->
        <div class="nutrition-card">
          <h5 class="mb-3">Log Meal</h5>
          <div class="alert-custom alert-warning">
            <small>⚠️ Only meals/foods recognized by Spoonacular can be logged. Start typing to see suggestions.</small>
          </div>
          <form @submit.prevent="logMeal">
            <div class="row g-3">
              <div class="col-12 col-md-5 autocomplete-container">
                <input
                  type="text"
                  v-model="mealName"
                  class="form-control"
                  placeholder="Start typing food/meal..."
                  required
                  autocomplete="off"
                  @input="onMealInput"
                  @focus="showLogButton = true"
                  @blur="handleMealInputBlur"
                >
                <div v-if="mealSuggestions.length > 0" class="autocomplete-results">
                  <div
                    v-for="suggestion in mealSuggestions"
                    :key="suggestion.id"
                    class="autocomplete-item"
                    @click="selectMeal(suggestion)"
                  >
                    {{ suggestion.name || suggestion.title }}
                  </div>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <input
                  type="number"
                  v-model.number="mealServings"
                  class="form-control"
                  placeholder="Servings"
                  min="0.1"
                  step="0.1"
                  required
                  @focus="showLogButton = true"
                  @blur="handleServingsBlur"
                >
              </div>
              <div class="col-6 col-md-4">
                <button 
                  type="submit" 
                  class="btn btn-primary w-100 log-meal-btn" 
                  :class="{ 'show': showLogButton }"
                  :disabled="isLogging"
                  @mouseenter="showLogButton = true"
                >
                  <span v-if="!isLogging">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Log Meal
                  </span>
                  <span v-else>
                    <span class="loading-spinner"></span>   
                    Logging...
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Today's Meals -->
        <div class="nutrition-card">
          <h5 class="mb-3">{{ selectedDateStr === todayStr ? "Today's" : selectedDateStr + "'s" }} Meals</h5>
          <div v-if="isLoadingMeals" class="empty-state">
            <span class="loading-spinner-large"></span>
            <p>Loading meals...</p>
          </div>
          <div v-else-if="currentMeals.length === 0" class="empty-state">
            <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">🍽️</div>
            <p>No meals logged yet. Log a meal above!</p>
          </div>
          <div v-else>
            <div
              v-for="meal in currentMeals"
              :key="meal.id"
              class="meal-item"
            >
              <div class="d-flex justify-content-between align-items-center">
                <div class="meal-details">
                  <strong>{{ meal.name }}</strong>
                  <div class="small text-muted">
                    {{ Math.round(meal.calories) }} cal | {{ meal.protein.toFixed(1) }}g protein | {{ meal.carbs.toFixed(1) }}g carbs | {{ meal.fat.toFixed(1) }}g fat
                  </div>
                  <div class="small text-muted">Servings: {{ meal.servings }}</div>
                </div>
                <button
                  class="btn btn-outline-danger btn-sm delete-btn"
                  @click="handleDeleteMeal(meal)"
                  title="Delete meal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Goals Modal -->
    <div v-if="showGoalsModal" class="modal-overlay" @click="showGoalsModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h5>Edit Nutrition Goals</h5>
          <button class="btn-close" @click="showGoalsModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Calories</label>
            <input type="number" v-model.number="tempGoals.calories" class="form-control" min="1000" max="5000" step="50">
          </div>
          <div class="form-group">
            <label>Protein (g)</label>
            <input type="number" v-model.number="tempGoals.protein" class="form-control" min="50" max="500" step="5">
          </div>
          <div class="form-group">
            <label>Carbs (g)</label>
            <input type="number" v-model.number="tempGoals.carbs" class="form-control" min="50" max="500" step="5">
          </div>
          <div class="form-group">
            <label>Fat (g)</label>
            <input type="number" v-model.number="tempGoals.fat" class="form-control" min="20" max="200" step="5">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showGoalsModal = false">Cancel</button>
          <button class="btn btn-primary" @click="saveGoals">Save Goals</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import MiniCalendar from './MiniCalendar.vue'
import { supabase, getCurrentUser } from '@/lib/supabase'
import Swal from 'sweetalert2'

// Constants
const USE_LOCAL_DATABASE = true
const SPOONACULAR_API_KEY = '0ca96dd220c842a6bfdcddfcbcf15b5d'
const API_BASE = 'https://api.spoonacular.com'

// Extended local foods database
const localFoodsDB = [
  { id: 5001, name: "Grilled Chicken Salad", calories: 350, protein: 35, carbs: 15, fat: 18 },
  { id: 5002, name: "Spaghetti Bolognese", calories: 550, protein: 28, carbs: 65, fat: 18 },
  { id: 5003, name: "Beef Burger", calories: 520, protein: 30, carbs: 40, fat: 25 },
  { id: 5004, name: "Caesar Salad", calories: 380, protein: 15, carbs: 12, fat: 32 },
  { id: 5005, name: "Chicken Stir Fry", calories: 420, protein: 32, carbs: 45, fat: 12 },
  { id: 5006, name: "Salmon with Rice", calories: 480, protein: 35, carbs: 50, fat: 15 },
  { id: 5007, name: "Pizza Margherita", calories: 450, protein: 18, carbs: 55, fat: 18 },
  { id: 5008, name: "Vegetable Curry", calories: 320, protein: 12, carbs: 48, fat: 10 },
  { id: 5009, name: "Beef Tacos", calories: 380, protein: 25, carbs: 35, fat: 16 },
  { id: 5010, name: "Tuna Sandwich", calories: 340, protein: 22, carbs: 42, fat: 8 },
  { id: 5011, name: "Chicken Burrito", calories: 520, protein: 30, carbs: 58, fat: 18 },
  { id: 5012, name: "Greek Salad", calories: 280, protein: 12, carbs: 15, fat: 20 },
  { id: 5013, name: "Pork Fried Rice", calories: 480, protein: 24, carbs: 62, fat: 16 },
  { id: 5014, name: "Chicken Quesadilla", calories: 440, protein: 28, carbs: 38, fat: 20 },
  { id: 5015, name: "Beef Stew", calories: 380, protein: 32, carbs: 28, fat: 15 },
  { id: 5016, name: "Fish and Chips", calories: 620, protein: 28, carbs: 68, fat: 28 },
  { id: 5017, name: "Chicken Wrap", calories: 420, protein: 26, carbs: 45, fat: 14 },
  { id: 5018, name: "Vegetable Lasagna", calories: 380, protein: 18, carbs: 42, fat: 16 },
  { id: 5019, name: "Shrimp Pasta", calories: 460, protein: 28, carbs: 52, fat: 14 },
  { id: 5020, name: "BBQ Chicken", calories: 390, protein: 35, carbs: 25, fat: 16 },
  { id: 5021, name: "Omelette", calories: 280, protein: 20, carbs: 4, fat: 20 },
  { id: 5022, name: "Pancakes", calories: 520, protein: 12, carbs: 78, fat: 18 },
  { id: 5023, name: "French Toast", calories: 480, protein: 14, carbs: 68, fat: 16 },
  { id: 5024, name: "Avocado Toast", calories: 320, protein: 12, carbs: 38, fat: 14 },
  { id: 5025, name: "Smoothie Bowl", calories: 380, protein: 8, carbs: 72, fat: 8 },
  { id: 5026, name: "Mushroom Quesadillas", calories: 420, protein: 16, carbs: 45, fat: 18 },
  { id: 5027, name: "Cinnamon Rolls", calories: 480, protein: 8, carbs: 68, fat: 20 },
  { id: 5028, name: "Mung Bean Sprout and Quinoa Salad", calories: 290, protein: 12, carbs: 38, fat: 10 },
  { id: 5029, name: "Orange Ginger Granola Bars", calories: 220, protein: 5, carbs: 32, fat: 9 },
  { id: 5030, name: "Cold Soba Noodles", calories: 310, protein: 14, carbs: 52, fat: 6 },
  { id: 5031, name: "Grilled Portabella and Poblano Tacos", calories: 280, protein: 10, carbs: 35, fat: 12 },
  { id: 5032, name: "Instant Pot Quinoa Grain Bowl", calories: 380, protein: 14, carbs: 58, fat: 11 },
  { id: 5033, name: "Strawberries and Cream Scones", calories: 340, protein: 6, carbs: 48, fat: 14 },
  { id: 5034, name: "Avocado Tomato & Mozzarella Panini", calories: 420, protein: 18, carbs: 38, fat: 22 },
  { id: 5035, name: "One Pot Veggie Quinoa", calories: 320, protein: 11, carbs: 52, fat: 8 },
  { id: 5036, name: "Smoky Black Bean Soup With Sweet Potato & Kale", calories: 280, protein: 14, carbs: 48, fat: 5 },
  { id: 5037, name: "Easy Avocado Egg Quinoa Breakfast Bowl", calories: 390, protein: 16, carbs: 42, fat: 18 },
  { id: 5038, name: "Avocado and Orange Salad With Orange-Ginger Dressing", calories: 250, protein: 4, carbs: 28, fat: 14 },
  { id: 5039, name: "Breakfast Tacos", calories: 380, protein: 18, carbs: 32, fat: 20 },
  { id: 5040, name: "Indian Lentil Dahl", calories: 310, protein: 16, carbs: 48, fat: 7 },
  { id: 5041, name: "Cracked Wheat Cereal", calories: 260, protein: 8, carbs: 52, fat: 3 },
  { id: 5042, name: "Coriander Ravioli With Pumpkin & Cottage Cheese Filling", calories: 420, protein: 18, carbs: 52, fat: 16 },
  { id: 5043, name: "Black Lentil and Couscous Salad", calories: 340, protein: 15, carbs: 55, fat: 8 },
  { id: 5044, name: "Cinnamon Buns With Maple Glaze", calories: 510, protein: 9, carbs: 72, fat: 21 },
  { id: 5045, name: "Lemon White Wine Chicken over Linguini", calories: 540, protein: 38, carbs: 58, fat: 14 },
  { id: 5046, name: "Farfalle with Peas, Ham and Cream", calories: 580, protein: 28, carbs: 62, fat: 24 },
  { id: 5047, name: "Cauliflower, Brown Rice, and Vegetable Fried Rice", calories: 320, protein: 10, carbs: 54, fat: 8 },
  { id: 5048, name: "Bruschetta Style Pork & Pasta", calories: 520, protein: 32, carbs: 56, fat: 18 },
  { id: 5049, name: "Mushroom Tarragon Fish", calories: 280, protein: 32, carbs: 12, fat: 12 },
  { id: 5050, name: "Agedashi Tofu", calories: 240, protein: 14, carbs: 18, fat: 12 },
  { id: 5051, name: "Lemon Scented Polenta Pancakes with Blueberry Thyme Syrup", calories: 420, protein: 8, carbs: 68, fat: 14 },
  { id: 5052, name: "Ozoni", calories: 290, protein: 12, carbs: 42, fat: 8 },
  { id: 5053, name: "Lemon-Poppy Seed Scones", calories: 380, protein: 7, carbs: 52, fat: 16 },
  { id: 5054, name: "Potato Gnocchi With Kale and Mushrooms In A Goat Cheese Sauce", calories: 480, protein: 16, carbs: 58, fat: 20 },
  { id: 5055, name: "Korean Sweet n Sour Chicken", calories: 460, protein: 32, carbs: 52, fat: 14 },
  { id: 5056, name: "Beef Lo Mein Noodles", calories: 520, protein: 28, carbs: 62, fat: 18 },
  { id: 5057, name: "Boozy Bbq Chicken", calories: 410, protein: 36, carbs: 28, fat: 16 },
  { id: 5058, name: "Caldo Verde - Portuguese Kale Soup", calories: 280, protein: 14, carbs: 32, fat: 11 },
  { id: 5059, name: "Chocolate Chip Coconut Muffins", calories: 340, protein: 6, carbs: 48, fat: 15 },
  { id: 5060, name: "Roasted Chicken and Brown Rice Soup", calories: 320, protein: 24, carbs: 38, fat: 9 },
  { id: 5061, name: "Thai Basil Chicken With Green Curry", calories: 420, protein: 32, carbs: 28, fat: 20 },
  { id: 5062, name: "Carrot Quinoa Muffins", calories: 280, protein: 7, carbs: 42, fat: 10 },
  { id: 5063, name: "3 Delicious Twists on an Egg Salad Sandwich", calories: 380, protein: 18, carbs: 32, fat: 20 },
  { id: 5064, name: "Classic Wedge Salad", calories: 320, protein: 12, carbs: 18, fat: 24 },
  { id: 5065, name: "Chicken Sweet Corn and Green Chile Chowder", calories: 380, protein: 26, carbs: 42, fat: 12 },
  { id: 5066, name: "Easy Zesty Blueberry Muffins with Streusel Topping", calories: 360, protein: 6, carbs: 54, fat: 14 },
  { id: 5067, name: "Gluten Free Almond Blueberry Coffee Cake", calories: 420, protein: 9, carbs: 58, fat: 18 },
  { id: 5068, name: "Duck Breast with Redcurrant and Port Sauce", calories: 480, protein: 38, carbs: 22, fat: 28 },
  { id: 5069, name: "Bigoli with smoked salmon", calories: 520, protein: 28, carbs: 58, fat: 18 },
  { id: 5070, name: "Colorful Tomato and Spinach Seafood Pasta", calories: 440, protein: 32, carbs: 52, fat: 12 },
  { id: 5071, name: "Easy Chicken, Kielbasa and Shrimp Paella", calories: 560, protein: 38, carbs: 58, fat: 18 },
  { id: 5072, name: "Black Bean Garlic Shrimp Scramble", calories: 340, protein: 28, carbs: 24, fat: 14 },
  { id: 5073, name: "Easy Chicken Wings", calories: 480, protein: 32, carbs: 8, fat: 36 },
  { id: 5074, name: "Lemon Rosemary Chickpea Soup", calories: 290, protein: 14, carbs: 42, fat: 8 },
  { id: 5075, name: "Asparagus Parmesan Frittata", calories: 280, protein: 18, carbs: 8, fat: 20 },
  { id: 5076, name: "Egg Salad Wrap", calories: 360, protein: 16, carbs: 32, fat: 18 },
  { id: 5077, name: "Creamy Chicken Tikka Masala", calories: 520, protein: 36, carbs: 32, fat: 28 },
  { id: 5078, name: "Quiche with Swiss Chard and Mushroom", calories: 380, protein: 16, carbs: 28, fat: 24 },
  { id: 5079, name: "Mushroom Barley Soup", calories: 240, protein: 8, carbs: 42, fat: 5 },
  { id: 5080, name: "A Post Thanksgiving Sopa De Tortilla", calories: 320, protein: 18, carbs: 38, fat: 11 },
  { id: 5081, name: "Paneer & Fig Pizza", calories: 480, protein: 20, carbs: 58, fat: 18 },
  { id: 5082, name: "Mushroom Tofu Stew", calories: 260, protein: 16, carbs: 28, fat: 10 },
  { id: 5083, name: "Poached Egg With Spinach and Tomato", calories: 220, protein: 14, carbs: 12, fat: 14 },
  { id: 5084, name: "Blast Of Color Mexican Stuffed Bell Peppers", calories: 340, protein: 22, carbs: 38, fat: 12 },
  { id: 5085, name: "No Fuss Sunday Slow-Cooker Balsamic Pot Roast", calories: 420, protein: 36, carbs: 18, fat: 24 },
  { id: 5086, name: "Three-Cup Chicken", calories: 380, protein: 32, carbs: 22, fat: 18 },
  { id: 5087, name: "Strawberry Poppy Seed Muffins", calories: 320, protein: 6, carbs: 48, fat: 12 },
  { id: 5088, name: "Grilled Chicken Banh Mi", calories: 420, protein: 32, carbs: 42, fat: 14 },
  { id: 5089, name: "Pan Seared Lamb Loin With Chimichurri", calories: 520, protein: 38, carbs: 12, fat: 36 },
  { id: 5090, name: "Cherry Coconut Milk Smoothie", calories: 280, protein: 4, carbs: 42, fat: 12 },
  { id: 5091, name: "Gluten Free Dairy Free Sugar Free Chinese Chicken Salad", calories: 320, protein: 28, carbs: 24, fat: 14 },
  { id: 5092, name: "Persimmon, Pomegranate, and Goat Cheese Salad", calories: 290, protein: 8, carbs: 32, fat: 15 },
  { id: 5093, name: "Duck Egg Omelette With Caviar and Sour Cream", calories: 380, protein: 22, carbs: 6, fat: 30 },
  { id: 5094, name: "Applesauce Carrot Cake Muffins", calories: 310, protein: 5, carbs: 48, fat: 12 },
  { id: 5095, name: "Beef With Oranges and Spices", calories: 440, protein: 32, carbs: 28, fat: 24 },
  { id: 5096, name: "Celery, Orange and Smoked Mackerel Salad", calories: 320, protein: 24, carbs: 18, fat: 18 },
  { id: 5097, name: "Slow Cooker Spicy Hot Wings", calories: 460, protein: 36, carbs: 12, fat: 32 },
  { id: 5098, name: "Black Muffins", calories: 340, protein: 7, carbs: 52, fat: 13 },
  { id: 5099, name: "Layered Chicken Salad With Couscous", calories: 380, protein: 28, carbs: 42, fat: 11 },
  { id: 5100, name: "Chicken Ranch Burgers", calories: 520, protein: 34, carbs: 38, fat: 26 },
  { id: 5101, name: "Wan Ton Mee", calories: 420, protein: 22, carbs: 58, fat: 11 },
  { id: 5102, name: "Easy Sheet Pan Pancakes", calories: 480, protein: 12, carbs: 72, fat: 16 },
  { id: 5103, name: "Pan-Seared Honey Glazed Salmon with Collard Greens", calories: 460, protein: 36, carbs: 28, fat: 22 },
  { id: 5104, name: "Gluten Free Frosted Pumpkin Doughnuts", calories: 380, protein: 6, carbs: 58, fat: 15 },
  { id: 5105, name: "Baked Spare Ribs With Red Wine Lees", calories: 580, protein: 32, carbs: 18, fat: 42 },
  { id: 5106, name: "Classic French Mussels", calories: 320, protein: 28, carbs: 18, fat: 14 },
  { id: 5107, name: "Miniature Fruit Tarts", calories: 280, protein: 4, carbs: 42, fat: 11 }
]

// Reactive data
const currentUser = ref(null)
const selectedDate = ref(new Date())
const selectedDateStr = computed(() => formatDate(selectedDate.value))
const todayStr = computed(() => formatDate(new Date()))

const loggedMeals = ref([])
const isLoadingMeals = ref(false)
const goals = ref({
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65
})

const mealName = ref('')
const mealServings = ref(1)
const isLogging = ref(false)
const selectedFood = ref(null)
const mealSuggestions = ref([])
let autocompleteTimeout = null
const showLogButton = ref(false)
const showGoalsModal = ref(false)
const tempGoals = ref({ ...goals.value })

// Charts refs
const macroChartCanvas = ref(null)
const progressChartCanvas = ref(null)
let macroChart = null
let progressChart = null

// Computed properties
const currentMeals = computed(() => {
  return loggedMeals.value.filter(meal => meal.date === selectedDateStr.value)
})

const datesWithMeals = computed(() => {
  const dates = new Set()
  loggedMeals.value.forEach(meal => {
    dates.add(meal.date)
  })
  return Array.from(dates)
})

const totals = computed(() => {
  return currentMeals.value.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
})

const calPct = computed(() => Math.round((totals.value.calories / goals.value.calories) * 100))
const protPct = computed(() => Math.round((totals.value.protein / goals.value.protein) * 100))
const carbPct = computed(() => Math.round((totals.value.carbs / goals.value.carbs) * 100))
const fatPct = computed(() => Math.round((totals.value.fat / goals.value.fat) * 100))

// Methods
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseNutritionValue(value) {
  if (!value) return 0
  return parseFloat(value.toString().replace(/[^0-9.]/g, '')) || 0
}

async function getNutritionByName(mealName) {
  if (USE_LOCAL_DATABASE) {
    const found = localFoodsDB.find(f =>
      f.name.toLowerCase() === mealName.toLowerCase() ||
      f.name.toLowerCase().includes(mealName.toLowerCase()) ||
      mealName.toLowerCase().includes(f.name.toLowerCase())
    )

    if (found) {
      return {
        calories: Number(found.calories) || 0,
        protein: Number(found.protein) || 0,
        carbs: Number(found.carbs) || 0,
        fat: Number(found.fat) || 0
      }
    }

    return { calories: 400, protein: 20, carbs: 45, fat: 15 }
  }

  try {
    const searchResponse = await fetch(
      `${API_BASE}/food/menuItems/search?apiKey=${SPOONACULAR_API_KEY}&query=${encodeURIComponent(mealName)}&number=1`
    )
    if (!searchResponse.ok) throw new Error('Search failed')
    const searchData = await searchResponse.json()

    if (!searchData.menuItems || searchData.menuItems.length === 0) {
      throw new Error('Food not found')
    }

    const foodId = searchData.menuItems[0].id
    const nutritionResponse = await fetch(
      `${API_BASE}/food/menuItems/${foodId}?apiKey=${SPOONACULAR_API_KEY}`
    )
    if (!nutritionResponse.ok) throw new Error('Nutrition fetch failed')
    const nutritionData = await nutritionResponse.json()

    return {
      calories: parseNutritionValue(nutritionData.nutrition?.calories),
      protein: parseNutritionValue(nutritionData.nutrition?.protein),
      carbs: parseNutritionValue(nutritionData.nutrition?.carbs),
      fat: parseNutritionValue(nutritionData.nutrition?.fat)
    }
  } catch (error) {
    console.error('Error getting nutrition by name:', error)
    return { calories: 500, protein: 30, carbs: 50, fat: 20 }
  }
}

async function loadMealsFromSupabase() {
  isLoadingMeals.value = true
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .order('date', { ascending: false })

    if (error) throw error
    
    const transformedMeals = []
    
    for (const plan of data || []) {
      const nutrition = await getNutritionByName(plan.title)
      const servings = plan.servings || 1

      transformedMeals.push({
        id: `${plan.date}-${plan.meal_type}-${plan.id}`,
        name: plan.title,
        servings: servings,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        date: plan.date,
        timestamp: new Date(plan.date).toISOString()
      })
    }
    
    loggedMeals.value = transformedMeals
    
  } catch (error) {
    console.error('Error loading meals from Supabase:', error)
    const saved = localStorage.getItem('nutritionMeals')
    if (saved) {
      try {
        loggedMeals.value = JSON.parse(saved)
      } catch {
        console.warn('Failed to parse saved meals')
      }
    }
  } finally {
    isLoadingMeals.value = false
  }
}

async function saveMealToSupabase(meal) {
  try {
    const { error } = await supabase
      .from('nutrition_meals')
      .insert({
        user_id: currentUser.value.id,
        spoonacular_id: meal.spoonacularId,
        name: meal.name,
        servings: meal.servings,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        date: meal.date,
        timestamp: meal.timestamp
      })

    if (error) throw error
    return true
    
  } catch (error) {
    console.error('Error saving meal to Supabase:', error)
    localStorage.setItem('nutritionMeals', JSON.stringify(loggedMeals.value))
    return false
  }
}

async function deleteMealFromSupabase(mealId) {
  try {
    const mealToDelete = loggedMeals.value.find(m => m.id === mealId)
    
    if (!mealToDelete) return false

    const { error } = await supabase
      .from('nutrition_meals')
      .delete()
      .eq('id', mealToDelete.id)
      .eq('user_id', currentUser.value.id)

    if (error) throw error
    return true
    
  } catch (error) {
    console.error('Error deleting meal from Supabase:', error)
    return false
  }
}

async function searchFood(query) {
  if (query.length < 2) return []

  if (USE_LOCAL_DATABASE) {
    const lowerQuery = query.toLowerCase()
    return localFoodsDB.filter(item => item.name.toLowerCase().includes(lowerQuery)).slice(0, 10)
  }

  try {
    const response = await fetch(
      `${API_BASE}/food/menuItems/search?apiKey=${SPOONACULAR_API_KEY}&query=${encodeURIComponent(query)}&number=10`
    )

    if (!response.ok) throw new Error('API request failed')
    const data = await response.json()
    return data.menuItems || []
  } catch (error) {
    console.error('Food search error:', error)
    const lowerQuery = query.toLowerCase()
    return localFoodsDB.filter(item => item.name.toLowerCase().includes(lowerQuery)).slice(0, 10)
  }
}

async function getFoodNutrition(id) {
  if (USE_LOCAL_DATABASE) {
    const found = localFoodsDB.find(f => f.id == id)
    if (!found) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    return {
      calories: Number(found.calories) || 0,
      protein: Number(found.protein) || 0,
      carbs: Number(found.carbs) || 0,
      fat: Number(found.fat) || 0
    }
  }

  try {
    const response = await fetch(
      `${API_BASE}/food/menuItems/${id}?apiKey=${SPOONACULAR_API_KEY}`
    )
    if (!response.ok) throw new Error('API request failed')
    const data = await response.json()

    return {
      calories: parseNutritionValue(data.nutrition?.calories),
      protein: parseNutritionValue(data.nutrition?.protein),
      carbs: parseNutritionValue(data.nutrition?.carbs),
      fat: parseNutritionValue(data.nutrition?.fat)
    }
  } catch (error) {
    console.error('Food nutrition error:', error)
    const found = localFoodsDB.find(f => f.id == id)
    if (!found) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    return {
      calories: Number(found.calories) || 0,
      protein: Number(found.protein) || 0,
      carbs: Number(found.carbs) || 0,
      fat: Number(found.fat) || 0
    }
  }
}

function onMealInput() {
  clearTimeout(autocompleteTimeout)
  const query = mealName.value.trim()

  if (query.length < 2) {
    mealSuggestions.value = []
    return
  }

  autocompleteTimeout = setTimeout(async () => {
    mealSuggestions.value = await searchFood(query)
  }, 300)
}

function selectMeal(suggestion) {
  selectedFood.value = suggestion
  mealName.value = suggestion.name || suggestion.title
  mealSuggestions.value = []
}

async function logMeal() {
  if (!selectedFood.value) {
    await Swal.fire('Invalid Selection', 'Please select a valid food/meal from the suggestions', 'info')
    return
  }

  if (mealServings.value <= 0) {
    await Swal.fire('Invalid Servings', 'Please enter a valid number of servings', 'info')
    return
  }

  isLogging.value = true

  try {
    const nutrition = await getFoodNutrition(selectedFood.value.id)

    const newMeal = {
      id: Date.now(),
      spoonacularId: selectedFood.value.id,
      name: selectedFood.value.name || selectedFood.value.title,
      servings: mealServings.value,
      calories: nutrition.calories * mealServings.value,
      protein: nutrition.protein * mealServings.value,
      carbs: nutrition.carbs * mealServings.value,
      fat: nutrition.fat * mealServings.value,
      date: selectedDateStr.value,
      timestamp: new Date().toISOString()
    }

    const success = await saveMealToSupabase(newMeal)
    
    if (success) {
      await loadMealsFromSupabase()
      updateCharts()

      mealName.value = ''
      mealServings.value = 1
      selectedFood.value = null
      showLogButton.value = false
      
      await Swal.fire('Meal Logged!', 'Your meal has been successfully logged.', 'success')
    } else {
      await Swal.fire('Saved Locally', 'Failed to save to database. Meal saved locally instead.', 'warning')
    }
  } catch (error) {
    console.error(error)
    await Swal.fire('Error', 'Failed to log meal. Please try again.', 'error')
  } finally {
    isLogging.value = false
  }
}

async function handleDeleteMeal(meal) {
  const result = await Swal.fire({
    title: 'Confirm Delete',
    text: `Are you sure you want to delete "${meal.name}"? This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel'
  })

  if (!result.isConfirmed) return

  try {
    const success = await deleteMealFromSupabase(meal.id)
    
    if (success) {
      loggedMeals.value = loggedMeals.value.filter(m => m.id !== meal.id)
      updateCharts()
      await Swal.fire('Deleted!', 'Meal has been deleted.', 'success')
    } else {
      loggedMeals.value = loggedMeals.value.filter(m => m.id !== meal.id)
      localStorage.setItem('nutritionMeals', JSON.stringify(loggedMeals.value))
      updateCharts()
      await Swal.fire('Deleted!', 'Meal has been deleted.', 'success')
    }
  } catch (error) {
    console.error(error)
    await Swal.fire('Error', 'Failed to delete meal.', 'error')
  }
}

function onDateSelect(date) {
  selectedDate.value = date
}

function formatDisplayDate(date) {
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

function handleMealInputBlur() {
  setTimeout(() => {
    if (!mealSuggestions.value.length) {
      showLogButton.value = false
    }
  }, 200)
}

function handleServingsBlur() {
  setTimeout(() => {
    showLogButton.value = false
  }, 200)
}

function saveGoals() {
  goals.value = { ...tempGoals.value }
  localStorage.setItem('nutritionGoals', JSON.stringify(goals.value))
  showGoalsModal.value = false
  updateCharts()
}

function initCharts() {
  nextTick(() => {
    if (macroChartCanvas.value) {
      macroChart = new Chart(macroChartCanvas.value, {
        type: 'doughnut',
        data: {
          labels: ['Protein', 'Carbs', 'Fat'],
          datasets: [{
            data: [totals.value.protein || 1, totals.value.carbs || 1, totals.value.fat || 1],
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
      })
    }

    if (progressChartCanvas.value) {
      progressChart = new Chart(progressChartCanvas.value, {
        type: 'bar',
        data: {
          labels: ['Calories', 'Protein', 'Carbs', 'Fat'],
          datasets: [{
            label: '% of Goal',
            data: [calPct.value, protPct.value, carbPct.value, fatPct.value],
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
      })
    }
  })
}

function updateCharts() {
  if (macroChart) {
    macroChart.data.datasets[0].data = [totals.value.protein || 1, totals.value.carbs || 1, totals.value.fat || 1]
    macroChart.update()
  }

  if (progressChart) {
    progressChart.data.datasets[0].data = [calPct.value, protPct.value, carbPct.value, fatPct.value]
    progressChart.update()
  }
}

function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1 })

  nextTick(() => {
    document.querySelectorAll('.fade-in').forEach((el, i) => {
      el.style.setProperty('--delay', `${i * 0.105}s`) 
      observer.observe(el)
    })
  })
}

watch(selectedDate, updateCharts)

onMounted(async () => {
  try {
    // Load saved goals
    const savedGoals = localStorage.getItem('nutritionGoals')
    if (savedGoals) {
      goals.value = JSON.parse(savedGoals)
      tempGoals.value = { ...goals.value }
    }
    
    currentUser.value = await getCurrentUser()
    await loadMealsFromSupabase()
    initCharts()
    setupScrollAnimations()
  } catch (error) {
    console.error('Error initializing:', error)
    const saved = localStorage.getItem('nutritionMeals')
    if (saved) {
      try {
        loggedMeals.value = JSON.parse(saved)
      } catch {
        console.warn('Failed to parse saved meals')
      }
    }
    initCharts()
    setupScrollAnimations()
  }
})
</script>

<style scoped>
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #48bb78;
  --danger-color: #f56565;
  --light-bg: #f8f9fa;
}

.nutrition-tracker {
  background-color: var(--light-bg);
  min-height: 100vh;
  padding: 2rem 0;
}

.nutrition-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 1.5rem;
  transition: box-shadow 0.2s ease;
}

.nutrition-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.nutrition-card h5 {
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
}

.calendar-container {
  position: relative;
}

.nutrition-stat {
  text-align: center;
  padding: 1rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: bold;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.25rem;
}

.progress-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.pc-calories { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.pc-protein { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.pc-carbs { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.pc-fat { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }

.chart-container {
  position: relative;
  height: 300px;
  margin-bottom: 2rem;
  min-height: 250px;
}

.form-control, .form-select {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.form-control:focus, .form-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.btn-primary {
  background: linear-gradient(135deg, #5568d3 0%, #653a91 100%) !important;
  border: none !important;
  font-weight: 500;
  transition: all 0.2s ease;
  color: white !important;
  opacity: 1 !important;
  visibility: visible !important;
  display: inline-block !important;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5568d3 0%, #653a91 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  color: white !important;
}

.btn-primary:disabled {
  background: #ccc !important;
  transform: none;
  box-shadow: none;
  opacity: 0.7 !important;
  color: white !important;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.meal-item {
  background: white;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
}

.meal-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.meal-details {
  flex: 1;
}

.delete-btn {
  min-width: 40px;
  height: 40px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-color: #dc3545;
  color: #dc3545;
  background: white;
}

.delete-btn:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.delete-btn svg {
  width: 16px;
  height: 16px;
}

.log-meal-btn {
  min-height: 38px;
  padding: 0.5rem 1rem;
  opacity: 0;
  transform: translateX(-10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.log-meal-btn.show {
  opacity: 1 !important;
  transform: translateX(0);
  visibility: visible !important;
}

.log-meal-btn:disabled {
  opacity: 0.7 !important;
}

.autocomplete-container {
  position: relative;
}

.autocomplete-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.autocomplete-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.autocomplete-item:hover {
  background: var(--light-bg);
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  margin-right: 0.5rem;
}

.loading-spinner-large {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid rgba(102, 126, 234, 0.3);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.alert-custom {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.alert-warning {
  background: #fff3cd;
  color: #664d03;
  border: 1px solid #ffe69c;
}

.tracker-layout {
  display: flex;
  gap: 1rem;
}

.calendar-sidebar {
  width: 300px;
  flex-shrink: 0;
}

.calendar-section {
  width: 100%;
}

.calendar-toggle-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  color: #333;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.calendar-toggle-btn:hover {
  background: var(--light-bg);
  border-color: var(--primary-color);
}

.calendar-toggle-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.calendar-toggle-btn i {
  font-size: 1rem;
}

.calendar-dropdown {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
}

.calendar-header {
  margin-bottom: 1rem;
}

.calendar-header h6 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #333;
}

.selected-date-display {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.main-content {
  flex: 1;
  transition: margin-left 0.3s ease;
}

.hasMeal {
  border: 2px solid #48bb78;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(72, 187, 120, 0.5);
}

.fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  transition-delay: var(--delay, 0s);
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,  0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h5 {
  margin: 0;
  font-weight: 600;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin-bottom: 0.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-outline-primary {
  background: white;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
}

.btn-outline-primary:hover {
  background: var(--primary-color);
  color: white;
}

@media (max-width: 768px) {
  .progress-circle {
    width: 70px;
    height: 70px;
    font-size: 1rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .nutrition-tracker {
    padding: 1rem 0;
  }

  .nutrition-card {
    padding: 1rem;
  }

  .tracker-layout {
    flex-direction: column;
  }

  .calendar-sidebar {
    width: 100%;
  }

  .calendar-dropdown {
    margin-top: 0.5rem;
  }

  .meal-details {
    font-size: 0.9rem;
  }

  .meal-details .small {
    font-size: 0.8rem;
  }
  
  .chart-container {
    height: 250px;
    min-height: 200px;
  }
}

@media (max-width: 576px) {
  .modal-content {
    max-width: 100%;
    margin: 0 1rem;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
}
</style>