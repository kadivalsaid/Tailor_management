<?php
// ============================================================
// config.php — Database Connection
// WAMP Server default settings
// ============================================================

define('DB_HOST', 'localhost');
define('DB_USER', 'root');       // WAMP default user
define('DB_PASS', '');           // WAMP default password (khali)
define('DB_NAME', 'tailor_db');

error_log('Connecting to database: ' . DB_HOST . ' / ' . DB_NAME);

// Connect karo
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Connection check
if ($conn->connect_error) {
    http_response_code(500);
    error_log('Database connection error: ' . $conn->connect_error);
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error . '. WAMP mein database tayyar hai?'
    ]));
}

// UTF-8 set karo
$conn->set_charset('utf8mb4');

// JSON response header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight OPTIONS request handle karo
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Helper: JSON response bhejo
function sendResponse($success, $message, $data = null) {
    $res = ['success' => $success, 'message' => $message];
    if ($data !== null) $res['data'] = $data;
    echo json_encode($res, JSON_UNESCAPED_UNICODE);
    exit();
}

// Helper: POST body padhna
function getInput() {
    return json_decode(file_get_contents('php://input'), true);
}
