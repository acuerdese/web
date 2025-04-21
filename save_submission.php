<?php
// Set headers for XML response
header('Content-Type: application/xml; charset=utf-8');

// Get the raw POST data
$xmlData = file_get_contents('php://input');

// Validate the XML
if ($xmlData === false || empty($xmlData)) {
    echo '<?xml version="1.0" encoding="UTF-8"?><error>No data received</error>';
    exit;
}

// Simple XML validation
if (strpos($xmlData, '<?xml') === false) {
    echo '<?xml version="1.0" encoding="UTF-8"?><error>Invalid XML format</error>';
    exit;
}

// Create submissions directory if it doesn't exist
if (!file_exists('submissions')) {
    mkdir('submissions', 0755, true);
}

// Generate unique filename
$filename = 'submissions/submission_' . date('Y-m-d_His') . '_' . uniqid() . '.xml';

// Save the submission
if (file_put_contents($filename, $xmlData)) {
    // Also append to a master submissions file
    file_put_contents('submissions/all_submissions.xml', $xmlData . "\n", FILE_APPEND);
    
    // Return success response
    echo '<?xml version="1.0" encoding="UTF-8"?>
          <response>
              <status>success</status>
              <message>Submission received</message>
              <filename>' . htmlspecialchars($filename) . '</filename>
          </response>';
} else {
    echo '<?xml version="1.0" encoding="UTF-8"?>
          <response>
              <status>error</status>
              <message>Failed to save submission</message>
          </response>';
}
?>
