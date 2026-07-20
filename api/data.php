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

// ============================================
// VALIDATION
// ============================================
// Server-side hardening: the frontend already validates forms, but the API
// must not trust the client. Each entity has required fields + type/range
// checks; a request with any invalid record is rejected wholesale (no partial
// writes) so data/*.json never contains a malformed record.

function isNonEmptyString($v) {
    return is_string($v) && trim($v) !== '';
}

function isNonNegativeNumber($v) {
    return is_numeric($v) && (float)$v >= 0;
}

function isPositiveNumber($v) {
    return is_numeric($v) && (float)$v > 0;
}

function isValidEmailOrEmpty($v) {
    if (!isset($v) || $v === '') return true;
    return is_string($v) && filter_var($v, FILTER_VALIDATE_EMAIL) !== false;
}

// field => [required(bool), validator(callable)]
$recordSchemas = [
    'clients' => [
        'id' => [true, 'isNonEmptyString'],
        'firstName' => [true, 'isNonEmptyString'],
        'lastName' => [true, 'isNonEmptyString'],
        'email' => [false, 'isValidEmailOrEmpty'],
    ],
    'staff' => [
        'id' => [true, 'isNonEmptyString'],
        'firstName' => [true, 'isNonEmptyString'],
        'lastName' => [true, 'isNonEmptyString'],
        'email' => [false, 'isValidEmailOrEmpty'],
    ],
    'services' => [
        'id' => [true, 'isNonEmptyString'],
        'name' => [true, 'isNonEmptyString'],
        'duration' => [true, 'isPositiveNumber'],
        'price' => [true, 'isNonNegativeNumber'],
    ],
    'products' => [
        'id' => [true, 'isNonEmptyString'],
        'name' => [true, 'isNonEmptyString'],
        'price' => [true, 'isNonNegativeNumber'],
        'stock' => [true, 'isNonNegativeNumber'],
    ],
    'appointments' => [
        'id' => [true, 'isNonEmptyString'],
        'clientId' => [true, 'isNonEmptyString'],
        'staffId' => [true, 'isNonEmptyString'],
        'serviceId' => [true, 'isNonEmptyString'],
        'date' => [true, 'isNonEmptyString'],
        'time' => [true, 'isNonEmptyString'],
        'price' => [true, 'isNonNegativeNumber'],
    ],
    'sales' => [
        'id' => [true, 'isNonEmptyString'],
        'productId' => [true, 'isNonEmptyString'],
        'date' => [true, 'isNonEmptyString'],
        'quantity' => [true, 'isPositiveNumber'],
        'unitPrice' => [true, 'isNonNegativeNumber'],
        'total' => [true, 'isNonNegativeNumber'],
    ],
];

$appointmentStatuses = ['pending', 'completed', 'paid', 'cancelled', 'noshow'];

// Validates one record against an entity's schema. Returns an error string, or null if valid.
function validateRecord($entity, $record, $index, $schemas, $appointmentStatuses) {
    $prefix = "{$entity}[{$index}]";

    if (!is_array($record)) {
        return "$prefix must be an object";
    }
    $schema = $schemas[$entity] ?? null;
    if (!$schema) return null;

    foreach ($schema as $field => [$required, $validator]) {
        $present = array_key_exists($field, $record) && $record[$field] !== null && $record[$field] !== '';
        if (!$present) {
            if ($required) {
                return "$prefix.$field is required";
            }
            continue;
        }
        if (!call_user_func($validator, $record[$field])) {
            return "$prefix.$field is invalid";
        }
    }

    if ($entity === 'appointments' && isset($record['status']) && $record['status'] !== '' && !in_array($record['status'], $appointmentStatuses, true)) {
        return "$prefix.status must be one of: " . implode(', ', $appointmentStatuses);
    }

    return null;
}

// Validates an entity's payload (array of records, or the settings object). Returns an error string, or null if valid.
function validateEntityPayload($entity, $decoded, $schemas, $appointmentStatuses) {
    if ($entity === 'settings') {
        if (isset($decoded['email']) && !isValidEmailOrEmpty($decoded['email'])) {
            return 'settings.email is invalid';
        }
        return null;
    }

    foreach ($decoded as $index => $record) {
        $error = validateRecord($entity, $record, $index, $schemas, $appointmentStatuses);
        if ($error) return $error;
    }

    return null;
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
            $error = validateEntityPayload($e, $decoded[$e], $recordSchemas, $appointmentStatuses);
            if ($error) {
                respond(400, ['error' => $error]);
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

    $error = validateEntityPayload($entity, $decoded, $recordSchemas, $appointmentStatuses);
    if ($error) {
        respond(400, ['error' => $error]);
    }

    writeEntity($dataDir, $entity, $decoded);
    respond(200, ['success' => true]);
}

respond(405, ['error' => 'Method not allowed']);
