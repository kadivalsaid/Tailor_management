<?php
// ============================================================
// auth.php — Register & Login API (FIXED)
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

// Database connection
$conn = new mysqli('localhost', 'root', '', 'tailor_db');

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database connection failed']));
}

$conn->set_charset('utf8mb4');

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

// ========== REGISTER ==========
if ($action === 'register') {
    $shop_name = trim($input['shop_name'] ?? '');
    $username  = trim($input['username'] ?? '');
    $password  = trim($input['password'] ?? '');
    $phone     = trim($input['phone'] ?? '');
    $address   = trim($input['address'] ?? '');

    if (!$shop_name || !$username || !$password) {
        echo json_encode(['success' => false, 'message' => 'Shop naam, username aur password zaroori hai']);
        exit;
    }

    if (strlen($username) < 4) {
        echo json_encode(['success' => false, 'message' => 'Username 4 characters se kam nahi hona chahiye']);
        exit;
    }

    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password 6 characters se kam nahi hona chahiye']);
        exit;
    }

    // Check username exists
    $check = $conn->query("SELECT id FROM tailors WHERE username = '" . $conn->real_escape_string($username) . "'");
    if ($check && $check->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Yeh username pehle se registered hai']);
        exit;
    }

    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Insert
    $shop_name = $conn->real_escape_string($shop_name);
    $username = $conn->real_escape_string($username);
    $phone = $conn->real_escape_string($phone);
    $address = $conn->real_escape_string($address);

    $query = "INSERT INTO tailors (shop_name, username, password, phone, address) VALUES ('$shop_name', '$username', '$hashed_password', '$phone', '$address')";
    
    if ($conn->query($query)) {
        $tailor_id = $conn->insert_id;
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful!',
            'data' => [
                'tailor_id' => $tailor_id,
                'shop_name' => $shop_name,
                'username' => $username
            ]
        ]);
        exit;
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $conn->error]);
        exit;
    }
}

// ========== LOGIN ==========
elseif ($action === 'login') {
    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    if (!$username || !$password) {
        echo json_encode(['success' => false, 'message' => 'Username aur password daalein']);
        exit;
    }

    $username = $conn->real_escape_string($username);
    
    // Get user from database
    $query = "SELECT id, shop_name, username, password, phone FROM tailors WHERE username = '$username'";
    $result = $conn->query($query);

    if (!$result) {
        echo json_encode(['success' => false, 'message' => 'Database query failed']);
        exit;
    }

    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Username nahi mila']);
        exit;
    }

    $tailor = $result->fetch_assoc();

    // Verify password
    if (!password_verify($password, $tailor['password'])) {
        echo json_encode(['success' => false, 'message' => 'Password galat hai']);
        exit;
    }

    // Success - return tailor data
    echo json_encode([
        'success' => true,
        'message' => 'Login successful!',
        'data' => [
            'id' => intval($tailor['id']),
            'tailor_id' => intval($tailor['id']),
            'shop_name' => $tailor['shop_name'],
            'username' => $tailor['username'],
            'phone' => $tailor['phone']
        ]
    ]);
    exit;
}

else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
    exit;
}

$conn->close();
?>