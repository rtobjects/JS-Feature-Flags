<?php
//init
const storage = 'appData.json';
$data = array();
getData();

//functions
function getData() {
    global $data;
    $raw = file_get_contents(storage);
    $data = json_decode($raw, true);
}

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
    } else {
        http_response_code(404);
        echo json_encode(array("error" => "404", "message" => "app not found"));
    }
}