<?php
// Beauty Salon Management System - JSON data API
// GET  -> returns current DB as JSON (creates it from defaults if missing)
// POST -> overwrites DB with the posted JSON body

header('Content-Type: application/json');

$dataDir = __DIR__ . '/../data';
$dataFile = $dataDir . '/db.json';

$defaultDB = [
    'settings' => [
        'salonName' => 'Beauty Salon',
        'ivaCode' => '',
        'address' => '',
        'phone' => '',
        'email' => '',
        'website' => ''
    ],
    'clients' => [],
    'staff' => [],
    'services' => [],
    'products' => [],
    'appointments' => [],
    'sales' => []
];

function respond($code, $payload) {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

if (!is_dir($dataDir)) {
    if (!mkdir($dataDir, 0775, true)) {
        respond(500, ['error' => 'Could not create data directory']);
    }
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!file_exists($dataFile)) {
        $fp = fopen($dataFile, 'c+');
        if ($fp === false) {
            respond(500, ['error' => 'Could not create data file']);
        }
        flock($fp, LOCK_EX);
        fwrite($fp, json_encode($defaultDB, JSON_PRETTY_PRINT));
        flock($fp, LOCK_UN);
        fclose($fp);
        respond(200, $defaultDB);
    }

    $fp = fopen($dataFile, 'r');
    flock($fp, LOCK_SH);
    $contents = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    $decoded = json_decode($contents, true);
    if ($decoded === null && trim($contents) !== '') {
        respond(500, ['error' => 'Data file is corrupted']);
    }
    respond(200, $decoded ?? $defaultDB);
}

if ($method === 'POST' || $method === 'PUT') {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);

    if ($decoded === null && trim($raw) !== '') {
        respond(400, ['error' => 'Invalid JSON payload']);
    }
    if (!is_array($decoded)) {
        respond(400, ['error' => 'Payload must be a JSON object']);
    }

    // Basic shape validation: required top-level keys must exist
    $requiredKeys = ['settings', 'clients', 'staff', 'services', 'products', 'appointments', 'sales'];
    foreach ($requiredKeys as $key) {
        if (!array_key_exists($key, $decoded)) {
            respond(400, ['error' => "Missing required key: $key"]);
        }
    }

    $fp = fopen($dataFile, 'c+');
    if ($fp === false) {
        respond(500, ['error' => 'Could not open data file for writing']);
    }
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($decoded, JSON_PRETTY_PRINT));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    respond(200, ['success' => true]);
}

respond(405, ['error' => 'Method not allowed']);
