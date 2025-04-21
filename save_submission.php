<?php
header('Content-Type: application/xml; charset=utf-8');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Create submissions directory if it doesn't exist
$submissionsDir = 'submissions';
if (!file_exists($submissionsDir)) {
    if (!mkdir($submissionsDir, 0755, true)) {
        die('<?xml version="1.0" encoding="UTF-8"?><error>Failed to create submissions directory</error>');
    }
}

// Get the raw POST data
$xmlData = file_get_contents('php://input');

// Validate the XML data
if ($xmlData === false || empty($xmlData)) {
    die('<?xml version="1.0" encoding="UTF-8"?><error>No data received</error>');
}

// Simple XML validation
if (strpos($xmlData, '<?xml') === false || strpos($xmlData, '<submissions>') === false) {
    die('<?xml version="1.0" encoding="UTF-8"?><error>Invalid XML format</error>');
}

// Generate a unique filename with timestamp
$timestamp = date('Y-m-d_His');
$randomString = bin2hex(random_bytes(4));
$filename = "{$submissionsDir}/submission_{$timestamp}_{$randomString}.xml";

// Save the individual submission
if (!file_put_contents($filename, $xmlData)) {
    die('<?xml version="1.0" encoding="UTF-8"?><error>Failed to save submission</error>');
}

// Append to the master submissions file
$masterFile = "{$submissionsDir}/all_submissions.xml";
$xmlToAppend = simplexml_load_string($xmlData);
$formattedSubmission = formatSubmission($xmlToAppend);

if (file_exists($masterFile)) {
    $masterXml = simplexml_load_file($masterFile);
    $newSubmission = $masterXml->addChild('submission');
    $newSubmission->addChild('timestamp', $timestamp);
    $newSubmission->addChild('filename', basename($filename));
    
    // Add poll info
    $pollInfo = $newSubmission->addChild('poll');
    $pollInfo->addChild('title', (string)$xmlToAppend->poll->title);
    $pollInfo->addChild('question_count', (string)$xmlToAppend->poll->questions);
    
    // Add answers summary
    $answers = $newSubmission->addChild('answers');
    foreach ($xmlToAppend->answers->answer as $answer) {
        $ans = $answers->addChild('answer');
        $ans->addChild('question_short', shortenText((string)$answer->question, 30));
        $ans->addChild('value', (string)$answer->value);
    }
    
    $masterXml->asXML($masterFile);
} else {
    // Create new master file
    $masterXml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><submissions></submissions>');
    $newSubmission = $masterXml->addChild('submission');
    $newSubmission->addChild('timestamp', $timestamp);
    $newSubmission->addChild('filename', basename($filename));
    
    $pollInfo = $newSubmission->addChild('poll');
    $pollInfo->addChild('title', (string)$xmlToAppend->poll->title);
    $pollInfo->addChild('question_count', (string)$xmlToAppend->poll->questions);
    
    $answers = $newSubmission->addChild('answers');
    foreach ($xmlToAppend->answers->answer as $answer) {
        $ans = $answers->addChild('answer');
        $ans->addChild('question_short', shortenText((string)$answer->question, 30));
        $ans->addChild('value', (string)$answer->value);
    }
    
    $masterXml->asXML($masterFile);
}

// Return success response
echo '<?xml version="1.0" encoding="UTF-8"?>
<response>
    <status>success</status>
    <message>Submission received</message>
    <filename>' . htmlspecialchars(basename($filename)) . '</filename>
    <timestamp>' . $timestamp . '</timestamp>
</response>';

// Helper function to format submission
function formatSubmission($xml) {
    $formatted = "\n<submission>\n";
    $formatted .= "    <timestamp>" . date('Y-m-d H:i:s') . "</timestamp>\n";
    $formatted .= "    <poll>\n";
    $formatted .= "        <title>" . htmlspecialchars($xml->poll->title) . "</title>\n";
    $formatted .= "        <question_count>" . $xml->poll->questions . "</question_count>\n";
    $formatted .= "    </poll>\n";
    $formatted .= "    <answers>\n";
    
    foreach ($xml->answers->answer as $answer) {
        $formatted .= "        <answer>\n";
        $formatted .= "            <question>" . htmlspecialchars($answer->question) . "</question>\n";
        $formatted .= "            <value>" . htmlspecialchars($answer->value) . "</value>\n";
        $formatted .= "        </answer>\n";
    }
    
    $formatted .= "    </answers>\n";
    $formatted .= "</submission>\n";
    
    return $formatted;
}

// Helper function to shorten text
function shortenText($text, $length) {
    if (strlen($text) <= $length) {
        return $text;
    }
    return substr($text, 0, $length) . '...';
}
?>
