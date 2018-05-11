<?php
//init
const storage = '../appData.json';
const AWSAPIKey = 'AWSKey';
const AWSAPISecret = 'AWSSecret';
const CloudFrontDistID = 'AWSDistsID';
const OauthEndpoint = 'authEndpoint';
const RequiredScope = 'featureFlags';
const RequiredEntitlement = 'featureFlags';
$data = array();
getData();

//functions
//TODO: Setup better data handling, currently storging to file to remove from RTO platform dependency
function getData() {
    global $data;
    $raw = file_get_contents(storage);
    $data = json_decode($raw, true);
}

//TODO: Setup better data handling, currently storging to file to remove from RTO platform dependency
function updateData() {
    global $data;
    file_put_contents(storage, json_encode($data));
}

function listApps() {
    global $data;
    $out = array();
    for($i = 0; $i < count($data); $i++) {
        $out[] = array(
            "id" => $data[$i]["id"],
            "name" => $data[$i]["name"],
        );
    }
    return $out;
}

function getApp($id) {
    global $data;
    for($i = 0; $i < count($data); $i++) {
        if($id == $data[$i]['id']) {
            return $data[$i];
        }
    }
    throw new Exception("app not found");
}

function appExists($id) {
    global $data;
    for($i = 0; $i < count($data); $i++) {
        if($id == $data[$i]['id']) {
            return true;
        }
    }
    return false;
}

function updateApp($id, $update) {
    global $data;
    for($i = 0; $i < count($data); $i++) {
        if($id == $data[$i]['id']) {
            $data[$i] = $update;
        }
    }
    updateData();
    invalidateCache($id);
}

//TODO: may not be required, though useful to put behind some sort of caceh and invalidate when updates occur to reduce PHP application pressure
function invalidateCache($id) {
    require_once 'classes/CloudFront.php';

    $cf = new CloudFront(AWSAPIKey, AWSAPISecret, CloudFrontDistID);
    $cf->invalidate($id . '/flags.js');
}

function addApp($name, $domains) {
    global $data;
    $id = uniqidReal(rand(5, 7)) . "-" .
        uniqidReal(rand(5, 7)) . "-" .
        uniqidReal(rand(5, 7));

    while(appExists($id)) {
        $id = uniqidReal(rand(5, 7)) . "-" .
            uniqidReal(rand(5, 7)) . "-" .
            uniqidReal(rand(5, 7));
    }

    $data[] = array(
        "id" => $id,
        "name" => $name,
        "domains" => $domains,
        "flags" => array()
    );
    updateData();
    invalidateCache($id);
    return $id;
}

function isTokenValid($token) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, OauthEndpoint . '?token=' . $token);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $data = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if($httpcode>=200 && $httpcode<300) {
        $json = json_decode($data, true);

        //TODO: Setup third party solution for OAuth: example for RTO-OAuth
        if(in_array(RequiredScope, $json['scope']) && in_array(RequiredEntitlement, $json['user']['entitlement'])) {
            return true;
        }
    }
    return false;
}

function uniqidReal($lenght = 13) {
    // uniqid gives 13 chars, but you could adjust it to your needs.
    if (function_exists("random_bytes")) {
        $bytes = random_bytes(ceil($lenght / 2));
    } elseif (function_exists("openssl_random_pseudo_bytes")) {
        $bytes = openssl_random_pseudo_bytes(ceil($lenght / 2));
    } else {
        throw new Exception("no cryptographically secure random function available");
    }
    return substr(bin2hex($bytes), 0, $lenght);
}

function getRequestHeaders() {
    $headers = array();
    foreach($_SERVER as $key => $value) {
        if (substr($key, 0, 5) <> 'HTTP_') {
            continue;
        }
        $header = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))));
        $headers[$header] = $value;
    }
    return $headers;
}

$_HEADERS = getRequestHeaders();

//check authorization
if(!isset($_HEADERS['Authorization']) || strtolower(substr($_HEADERS['Authorization'], 0, 6)) != 'bearer') {
    http_response_code(401);
    echo json_encode(array("error" => "401", "message" => "authorization header missing or malformed"));
    return;
}

if(!isTokenValid(substr($_HEADERS['Authorization'], 7))) {
    http_response_code(403);
    echo json_encode(array("error" => "403", "message" => "supplied token is invalid or missing the correct entitlement/scope"));
    return;
}

//serve
header("Content-Type: application/json");
if($_SERVER["REQUEST_METHOD"] == "GET") {
    if(isset($_GET['list'])) {
        echo json_encode(listApps());
    } else if(isset($_GET['app'])) {
        try {
            echo json_encode(getApp($_GET['app']));
        } catch(Exception $e) {
            http_response_code(404);
            echo json_encode(array("error" => "404", "message" => "app not found"));
        }
    }
} else if($_SERVER["REQUEST_METHOD"] == "PUT") {
    $_PUT = file_get_contents("php://input");
    if(isset($_GET['app']) && appExists($_GET['app'])) {
        updateApp($_GET['app'], json_decode($_PUT));
        echo json_encode(array("status" => "updated"));
    } else {
        http_response_code(404);
        echo json_encode(array("error" => "404", "message" => "app not found"));
    }
} else if($_SERVER["REQUEST_METHOD"] == "POST") {
    $POST = file_get_contents("php://input");
    $_JSON = json_decode($POST, true);
    if(isset($_GET['list'])) {
        echo json_encode(array("status" => "created", "id" => addApp($_JSON['name'], $_JSON['domains'])));
    }
}