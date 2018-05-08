<?php

const libraryNameSpace = "rtoFeatureFlags";
const storage = 'appData.json';
const cacheTime = 100; //seconds
$data = array();
getData();

function getData() {
    global $data;
    $raw = file_get_contents(storage);
    $data = json_decode($raw, true);
}

function getOptions($id) {
    global $data;
    for($i = 0; $i < count($data); $i++) {
        if($data[$i]['id'] == $id) {
            return $data[$i]['flags'];
        }
    }
    throw new Exception("not found");
}

function getAppData($id) {
    global $data;
    for($i = 0; $i < count($data); $i++) {
        if($data[$i]['id'] == $id) {
            return array(
                "id" => $data[$i]['id'],
                "name" => $data[$i]['name'],
                "domains" => $data[$i]['domains']
            );
        }
    }
    throw new Exception("not found");
}

function getClientLibrary() {
    $lib = file_get_contents("../client/featureFlags.min.js");
    return $lib;
}

function getInitiator() {
    return "rtoFeatureFlags.initialize();";
}

function getFinalOutput($id) {
    try {
        $options = getOptions($id);
        $library = getClientLibrary();
        $initiator = getInitiator();
        $app = getAppData($id);
    } catch(Exception $e) {
        throw new Exception("not found");
    }

    return $library . libraryNameSpace . ".flags=" . json_encode($options) . "\n"
        . libraryNameSpace . ".application=" . json_encode($app) . ";\n" . $initiator;
}

header("Content-Type: application/javascript");
header("Expires: Sat, 26 Jul 2020 05:00:00 GMT" . date("D, d M Y H:i:s e", time() + cacheTime));

try {
    echo getFinalOutput($_GET["id"]);
} catch(Exception $e) {
    http_response_code(404);
}