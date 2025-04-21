<?php
header('Content-Type: application/json');

// Database configuration
$dbHost = 'localhost';
$dbUser = 'username';
$dbPass = 'password';
$dbName = 'poll_database';

try {
    // Create connection
    $conn = new PDO("mysql:host=$dbHost;dbname=$dbName", $dbUser, $dbPass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create table if it doesn't exist
    $createTable = "
    CREATE TABLE IF NOT EXISTS poll_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        q0 TEXT,
        q1 TEXT,
        q2 TEXT,
        q3 TEXT,
        q4 TEXT,
        q5 TEXT,
        q6 TEXT,
        q7 TEXT,
        q8 TEXT,
        q9 TEXT,
        image_preference VARCHAR(10),
        name TEXT,
        gender TEXT,
        location TEXT,
        email VARCHAR(255),
        mobile VARCHAR(20),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $conn->exec($createTable);

    // Prepare data from POST request
    $sessionId = session_id();
    $answers = [
        'session_id' => $sessionId,
        'q0' => $_POST['q0'] ?? null,
        'q1' => $_POST['q1'] ?? null,
        'q2' => $_POST['q2'] ?? null,
        'q3' => $_POST['q3'] ?? null,
        'q4' => $_POST['q4'] ?? null,
        'q5' => $_POST['q5'] ?? null, // Name
        'q6' => $_POST['q6'] ?? null, // Gender
        'q7' => $_POST['q7'] ?? null, // Location
        'q8' => $_POST['q8'] ?? null, // Email
        'q9' => $_POST['q9'] ?? null, // Mobile
        'image_preference' => $_POST['q0'] === 'left' || $_POST['q0'] === 'right' ? $_POST['q0'] : null,
        'name' => $_POST['q5'] ?? null,
        'gender' => $_POST['q6'] ?? null,
        'location' => $_POST['q7'] ?? null,
        'email' => $_POST['q8'] ?? null,
        'mobile' => $_POST['q9'] ?? null
    ];

    // Validate email if provided
    if (!empty($answers['email']) && !filter_var($answers['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email address");
    }

    // Insert data into database
    $stmt = $conn->prepare("
        INSERT INTO poll_responses (
            session_id, q0, q1, q2, q3, q4, q5, q6, q7, q8, q9,
            image_preference, name, gender, location, email, mobile
        ) VALUES (
            :session_id, :q0, :q1, :q2, :q3, :q4, :q5, :q6, :q7, :q8, :q9,
            :image_preference, :name, :gender, :location, :email, :mobile
        )
    ");

    $stmt->execute($answers);

    // Send success response
    echo json_encode([
        'status' => 'success',
        'message' => 'Thank you for completing the poll!'
    ]);

} catch(PDOException $e) {
    // Database error
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch(Exception $e) {
    // Other errors
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
