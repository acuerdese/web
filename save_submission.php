<?php
header('Content-Type: application/xml; charset=utf-8');

// Get the raw POST data
$xmlData = file_get_contents('php://input');

// Validate
if ($xmlData === false || empty($xmlData)) {
    echo '<?xml version="1.0" encoding="UTF-8"?><error>No data received</error>';
    exit;
}

if (strpos($xmlData, '<?xml') === false) {
    echo '<?xml version="1.0" encoding="UTF-8"?><error>Invalid XML format</error>';
    exit;
}

// Create submissions directory
if (!file_exists('submissions')) {
    mkdir('submissions', 0755, true);
}

// Save with unique filename
$filename = 'submissions/submission_' . date('Y-m-d_His') . '_' . uniqid() . '.xml';

if (file_put_contents($filename, $xmlData)) {
    file_put_contents('submissions/all_submissions.xml', $xmlData . "\n", FILE_APPEND);
    
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
