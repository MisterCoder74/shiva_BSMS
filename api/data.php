<?php
// Beauty Salon Management System - JSON data API
// One JSON file per entity under data/, so the store scales as data grows
// (e.g. dozens/hundreds of clients) without rewriting unrelated entities.
//
// GET  ?entity=clients            -> returns data/clients.json (creates with default if missing)
// POST ?entity=clients  (body=JSON)-> overwrites data/clients.json with the posted value
//
// Also supports GET/POST with no ?entity (or entity=all) for bulk load/import,
// operating on all entities in one request (used by initial migration/import).

header('Content-Type: application/json');

$dataDir = __DIR__ . '/../data';

$entities = ['settings', 'clients', 'staff', 'services', 'products', 'appointments', 'sales'];

$defaults = [
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

function entityFile($dataDir, $entity) {
    return $dataDir . '/' . $entity . '.json';
}

function readEntity($dataDir, $entity, $default) {
    $file = entityFile($dataDir, $entity);
    if (!file_exists($file)) {
        $fp = fopen($file, 'c+');
        if ($fp === false) {
            respond(500, ['error' => "Could not create data file for $entity"]);
        }
        flock($fp, LOCK_EX);
        fwrite($fp, json_encode($default, JSON_PRETTY_PRINT));
        flock($fp, LOCK_UN);
        fclose($fp);
        return $default;
    }

    $fp = fopen($file, 'r');
    flock($fp, LOCK_SH);
    $contents = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    $decoded = json_decode($contents, true);
    if ($decoded === null && trim($contents) !== '') {
        respond(500, ['error' => "Data file for $entity is corrupted"]);
    }
    return $decoded ?? $default;
}

function writeEntity($dataDir, $entity, $value) {
    $file = entityFile($dataDir, $entity);
    $fp = fopen($file, 'c+');
    if ($fp === false) {
        respond(500, ['error' => "Could not open data file for $entity"]);
    }
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($value, JSON_PRETTY_PRINT));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

if (!is_dir($dataDir)) {
    if (!mkdir($dataDir, 0775, true)) {
        respond(500, ['error' => 'Could not create data directory']);
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$entity = $_GET['entity'] ?? 'all';

if ($entity !== 'all' && !in_array($entity, $entities, true)) {
    respond(400, ['error' => "Unknown entity: $entity"]);
}

if ($method === 'GET') {
    if ($entity === 'all') {
        $result = [];
        foreach ($entities as $e) {
            $result[$e] = readEntity($dataDir, $e, $defaults[$e]);
        }
        respond(200, $result);
    }
    respond(200, readEntity($dataDir, $entity, $defaults[$entity]));
}

if ($method === 'POST' || $method === 'PUT') {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);

    if ($decoded === null && trim($raw) !== '') {
        respond(400, ['error' => 'Invalid JSON payload']);
    }

    if ($entity === 'all') {
        if (!is_array($decoded)) {
            respond(400, ['error' => 'Payload must be a JSON object']);
        }
        foreach ($entities as $e) {
            if (!array_key_exists($e, $decoded)) {
                respond(400, ['error' => "Missing required key: $e"]);
            }
        }
        foreach ($entities as $e) {
            writeEntity($dataDir, $e, $decoded[$e]);
        }
        respond(200, ['success' => true]);
    }

    // Single-entity write: settings is an object, everything else is an array
    if ($entity === 'settings') {
        if (!is_array($decoded)) {
            respond(400, ['error' => 'settings payload must be a JSON object']);
        }
    } else {
        if (!is_array($decoded)) {
            respond(400, ['error' => "$entity payload must be a JSON array"]);
        }
    }

    writeEntity($dataDir, $entity, $decoded);
    respond(200, ['success' => true]);
}

respond(405, ['error' => 'Method not allowed']);
