<?php
header('Content-Type: application/javascript');
// Seed sample data into localStorage when this script is requested.
$seed = [
	'pantry' => [],
	'recipes' => [],
	'savedRecipes' => [
		['id' => 101, 'title' => 'Spaghetti Bolognese', 'image' => '', 'readyInMinutes' => 25],
		['id' => 102, 'title' => 'Chicken Caesar Salad', 'image' => '', 'readyInMinutes' => 15],
		['id' => 103, 'title' => 'Vegetable Stir Fry', 'image' => '', 'readyInMinutes' => 20],
		['id' => 104, 'title' => 'Beef Tacos', 'image' => '', 'readyInMinutes' => 30],
		['id' => 105, 'title' => 'Thai Green Curry', 'image' => '', 'readyInMinutes' => 40],
		['id' => 106, 'title' => 'Pancakes', 'image' => '', 'readyInMinutes' => 20]
	],
	'mealPlans' => new stdClass(),
	'shoppingList' => [],
	'nutritionGoals' => ['calories' => 2000, 'protein' => 150, 'carbs' => 250, 'fat' => 65],
	'currentWeek' => date('c'),
	'currentRecipe' => new stdClass()
];

$key = 'recipeFinderData';
echo "if (!localStorage.getItem('" . $key . "')) { localStorage.setItem('" . $key . "', " . json_encode($seed) . "); }";

?>
