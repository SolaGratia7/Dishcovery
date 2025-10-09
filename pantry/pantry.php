<?php
header('Content-Type: application/json');

$file = 'pantry.json';

// ensure file exists
if (!file_exists($file)) {
    file_put_contents($file, json_encode([]));
}

// helper: read all items
function read_pantry($file) {
    $data = json_decode(file_get_contents($file), true); // true returns assoc array instead of object
    return is_array($data) ? $data : [];
}

// helper: write all items
function write_pantry($file, $data) {
    file_put_contents($file, json_encode(array_values($data), JSON_PRETTY_PRINT));
}

// helper: sanitize
function sanitize_item($it) {
    if (!is_array($it)) return null;
    if (!isset($it['id']) || !isset($it['name'])) return null;
    return [
        'id' => (string)$it['id'],
        'name' => (string)$it['name'],
        'category' => (string)($it['category'] ?? ''),
        'quantity' => (float)($it['quantity'] ?? 0),
        'unit' => (string)($it['unit'] ?? ''),
        'expiration' => (string)($it['expiration'] ?? '')
    ];
}

// handle POST (add or delete)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input'); // reads raw body of request 
    $data = json_decode($raw, true);
    if ($data === null) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON']);
        exit;
    }

    $pantry = read_pantry($file);

    // DELETE
    if (isset($data['deleteId'])) {
        $delId = (string)$data['deleteId'];
        $found = false;
        foreach ($pantry as $k => $it) { // for each key => value
            if ((string)$it['id'] === $delId) {
                array_splice($pantry, $k, 1); //k is the numeric index
                $found = true;
                break;
            }
        }
        write_pantry($file, $pantry);
        echo json_encode(['status' => $found ? 'deleted' : 'not_found']);
        exit;
    }

    // ADD
    $name = trim($data['name'] ?? '');
    $category = trim($data['category'] ?? '');
    $quantity = $data['quantity'] ?? '';
    $unit = trim($data['unit'] ?? '');
    $expiration = trim($data['expiration'] ?? '');

    if ($name === '' || $category === '' || $unit === '' || $expiration === '' || $quantity === '') {
        echo json_encode(['status' => 'error', 'message' => 'Missing fields']);
        exit;
    }

    if (!is_numeric($quantity)) {
        echo json_encode(['status' => 'error', 'message' => 'Quantity must be a number']);
        exit;
    }

    if (strtotime($expiration) === false) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid expiration date']);
        exit;
    }

    $newItem = [
        'id' => uniqid('', true),
        'name' => $name,
        'category' => $category,
        'quantity' => (float)$quantity,
        'unit' => $unit,
        'expiration' => $expiration
    ];

    $pantry[] = $newItem;
    write_pantry($file, $pantry);

    echo json_encode(['status' => 'added', 'item' => sanitize_item($newItem)]);
    exit;
}

// handle GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $pantry = read_pantry($file);
    $clean = array_map('sanitize_item', $pantry);
    echo json_encode(array_values(array_filter($clean)));
    exit;
}

// fallback
http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
