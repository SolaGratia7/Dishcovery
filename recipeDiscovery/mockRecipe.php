<?php
header('Content-Type: application/json');
// header('Access-Control-Allow-Origin: *');

$mockData = [
    "offset" => 0,
    "number" => 2,
    "results" => [
        [
            "id" => 715769,
            "title" => "Broccolini Quinoa Pilaf",
            "image" => "https://img.spoonacular.com/recipes/715769-312x231.jpg",
            "imageType" => "jpg",
            "readyInMinutes" => 30,
            "servings" => 4
        ],
        [
            "id" => 1095745,
            "title" => "Mushroom Hummus Crostini",
            "image" => "https://img.spoonacular.com/recipes/1095745-312x231.jpg",
            "imageType" => "jpg",
            "readyInMinutes" => 20,
            "servings" => 6
        ]
    ],
    "totalResults" => 2
];

// Return JSON
echo json_encode($mockData);
?>

