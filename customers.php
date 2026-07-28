<?php
// ============================================================
// customers.php — Customers CRUD API
// ============================================================

require_once 'config.php';

$input     = getInput();
$action    = $input['action']    ?? $_GET['action']    ?? '';
$tailor_id = $input['tailor_id'] ?? $_GET['tailor_id'] ?? 0;

if (!$tailor_id) {
    sendResponse(false, 'Tailor ID zaroori hai');
}

// ========== GET ALL CUSTOMERS ==========
if ($action === 'get_all') {
    $search = trim($_GET['search'] ?? '');

    if ($search) {
        $like = "%$search%";
        $stmt = $conn->prepare(
            "SELECT id, name, phone, address, notes, total_price, paid_amount, created_at
             FROM customers
             WHERE tailor_id = ? AND (name LIKE ? OR phone LIKE ?)
             ORDER BY created_at DESC"
        );
        $stmt->bind_param('iss', $tailor_id, $like, $like);
    } else {
        $stmt = $conn->prepare(
            "SELECT id, name, phone, address, notes, total_price, paid_amount, created_at
             FROM customers
             WHERE tailor_id = ?
             ORDER BY created_at DESC"
        );
        $stmt->bind_param('i', $tailor_id);
    }

    $stmt->execute();
    $result    = $stmt->get_result();
    $customers = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    sendResponse(true, 'Customers mile', $customers);
}

// ========== GET ONE CUSTOMER (with measurements) ==========
elseif ($action === 'get_one') {
    $customer_id = $input['customer_id'] ?? $_GET['customer_id'] ?? 0;

    // Customer info
    $stmt = $conn->prepare(
        "SELECT * FROM customers WHERE id = ? AND tailor_id = ?"
    );
    $stmt->bind_param('ii', $customer_id, $tailor_id);
    $stmt->execute();
    $result   = $stmt->get_result();
    $customer = $result->fetch_assoc();
    $stmt->close();

    if (!$customer) {
        sendResponse(false, 'Customer nahi mila');
    }

    // Fixed measurements
    $stmt2 = $conn->prepare(
        "SELECT type, field_name, field_value FROM measurements WHERE customer_id = ?"
    );
    $stmt2->bind_param('i', $customer_id);
    $stmt2->execute();
    $mResult       = $stmt2->get_result();
    $measurements  = $mResult->fetch_all(MYSQLI_ASSOC);
    $stmt2->close();

    // Custom (extra) measurements
    $stmt3 = $conn->prepare(
        "SELECT type, field_name, field_value FROM custom_measurements WHERE customer_id = ?"
    );
    $stmt3->bind_param('i', $customer_id);
    $stmt3->execute();
    $cmResult           = $stmt3->get_result();
    $custom_measurements = $cmResult->fetch_all(MYSQLI_ASSOC);
    $stmt3->close();

    // Payment history
    $stmt4 = $conn->prepare(
        "SELECT amount, paid_at FROM payments WHERE customer_id = ? ORDER BY paid_at DESC"
    );
    $stmt4->bind_param('i', $customer_id);
    $stmt4->execute();
    $pResult  = $stmt4->get_result();
    $payments = $pResult->fetch_all(MYSQLI_ASSOC);
    $stmt4->close();

    $customer['measurements']        = $measurements;
    $customer['custom_measurements'] = $custom_measurements;
    $customer['payments']            = $payments;

    sendResponse(true, 'Customer mila', $customer);
}

// ========== ADD CUSTOMER ==========
elseif ($action === 'add') {
    $name         = trim($input['name']    ?? '');
    $phone        = trim($input['phone']   ?? '');
    $address      = trim($input['address'] ?? '');
    $notes        = trim($input['notes']   ?? '');
    $total_price  = floatval($input['total_price']  ?? 0);
    $paid_amount  = floatval($input['paid_amount']  ?? 0);
    $measurements        = $input['measurements']        ?? [];
    $custom_measurements = $input['custom_measurements'] ?? [];

    if (!$name || !$phone) {
        sendResponse(false, 'Naam aur phone zaroori hai');
    }

    // Insert customer
    $stmt = $conn->prepare(
        "INSERT INTO customers (tailor_id, name, phone, address, notes, total_price, paid_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('issssdd', $tailor_id, $name, $phone, $address, $notes, $total_price, $paid_amount);

    if (!$stmt->execute()) {
        sendResponse(false, 'Customer save fail: ' . $conn->error);
    }

    $customer_id = $conn->insert_id;
    $stmt->close();

    // Insert fixed measurements
    if (!empty($measurements)) {
        $mStmt = $conn->prepare(
            "INSERT INTO measurements (customer_id, type, field_name, field_value) VALUES (?, ?, ?, ?)"
        );
        foreach ($measurements as $m) {
            if ($m['value'] !== null && $m['value'] !== '') {
                $mStmt->bind_param('issd', $customer_id, $m['type'], $m['name'], $m['value']);
                $mStmt->execute();
            }
        }
        $mStmt->close();
    }

    // Insert custom measurements
    if (!empty($custom_measurements)) {
        // Prepare two statements: one for numeric value, one for NULL value
        $cmStmtVal = $conn->prepare(
            "INSERT INTO custom_measurements (customer_id, type, field_name, field_value) VALUES (?, ?, ?, ?)"
        );
        $cmStmtNull = $conn->prepare(
            "INSERT INTO custom_measurements (customer_id, type, field_name, field_value) VALUES (?, ?, ?, NULL)"
        );
        foreach ($custom_measurements as $cm) {
            $label = trim($cm['label'] ?? '');
            $val = array_key_exists('val', $cm) ? $cm['val'] : null;
            if ($label === '') continue;
            if ($val === null || $val === '') {
                $cmStmtNull->bind_param('iss', $customer_id, $cm['type'], $label);
                $cmStmtNull->execute();
            } else {
                $num = floatval($val);
                $cmStmtVal->bind_param('issd', $customer_id, $cm['type'], $label, $num);
                $cmStmtVal->execute();
            }
        }
        $cmStmtVal->close();
        $cmStmtNull->close();
    }

    // Initial payment record
    if ($paid_amount > 0) {
        $pStmt = $conn->prepare(
            "INSERT INTO payments (customer_id, amount) VALUES (?, ?)"
        );
        $pStmt->bind_param('id', $customer_id, $paid_amount);
        $pStmt->execute();
        $pStmt->close();
    }

    sendResponse(true, 'Customer save ho gaya!', ['customer_id' => $customer_id]);
}

// ========== ADD PAYMENT ==========
elseif ($action === 'add_payment') {
    $customer_id = intval($input['customer_id'] ?? 0);
    $amount      = floatval($input['amount']      ?? 0);

    if (!$customer_id || $amount <= 0) {
        sendResponse(false, 'Sahi customer ID aur amount daalein');
    }

    // Update paid_amount
    $stmt = $conn->prepare(
        "UPDATE customers SET paid_amount = paid_amount + ? WHERE id = ? AND tailor_id = ?"
    );
    $stmt->bind_param('dii', $amount, $customer_id, $tailor_id);
    $stmt->execute();
    $stmt->close();

    // Payment record
    $pStmt = $conn->prepare(
        "INSERT INTO payments (customer_id, amount) VALUES (?, ?)"
    );
    $pStmt->bind_param('id', $customer_id, $amount);
    $pStmt->execute();
    $pStmt->close();

    // Updated customer payment info
    $info = $conn->prepare(
        "SELECT total_price, paid_amount FROM customers WHERE id = ?"
    );
    $info->bind_param('i', $customer_id);
    $info->execute();
    $row = $info->get_result()->fetch_assoc();
    $info->close();

    sendResponse(true, '₹' . $amount . ' payment add hua!', $row);
}

// ========== DELETE CUSTOMER ==========
elseif ($action === 'delete') {
    $customer_id = intval($input['customer_id'] ?? 0);

    $stmt = $conn->prepare(
        "DELETE FROM customers WHERE id = ? AND tailor_id = ?"
    );
    $stmt->bind_param('ii', $customer_id, $tailor_id);

    if ($stmt->execute() && $stmt->affected_rows > 0) {
        sendResponse(true, 'Customer delete ho gaya');
    } else {
        sendResponse(false, 'Delete fail hua');
    }
    $stmt->close();
}

// ========== STATS ==========
elseif ($action === 'stats') {
    $stmt = $conn->prepare(
        "SELECT COUNT(*) as total_customers,
                COALESCE(SUM(total_price), 0)  as total_income,
                COALESCE(SUM(paid_amount), 0)  as total_paid,
                COALESCE(SUM(total_price - paid_amount), 0) as total_balance
         FROM customers WHERE tailor_id = ?"
    );
    $stmt->bind_param('i', $tailor_id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    sendResponse(true, 'Stats ready', $result);
}

else {
    sendResponse(false, 'Galat action');
}

$conn->close();
