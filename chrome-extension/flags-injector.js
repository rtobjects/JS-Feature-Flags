var version = '0.0.1';

(function createChannel() {
  window.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != window)
      return;

    if (event.data.type && (event.data.type === "__ES_FEATUREFLAGS_APP")) {
      switch(event.data.action) {
        case "ready":
          //TODO: Version Check here
          getSyncedFlags(function(data) {
            window.postMessage({
              type: "__ES_FEATUREFLAGS_EXTENSION", status: "ready", version: version, local: data
            }, '*');
          }, event.data.payload.application.id);
          break;
        case "setup":
          sendDataToExtension(event.data);
          break;
      }
    }
  }, false);

  function sendDataToExtension(data) {
    chrome.runtime.sendMessage(data, null);
  }

  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      request.type = "__ES_FEATUREFLAGS_EXTENSION";
      window.postMessage(request, '*');
      if(request.status === 'update') {
        updateSyncedFlags(request.payload.id, request.payload.value, request.app);
      } else if(request.status === 'reset') {
        resetSyncedFlags(request.app);
      }
  });
}());

function updateSyncedFlags(id, value, app) {
  chrome.storage.sync.get(app, function(data) {
    if(!data[app]) {
      data[app] = {};
    }
    data[app][id] = value;
    chrome.storage.sync.set(data);
  });
}

function getSyncedFlags(callback, app) {
  chrome.storage.sync.get(app, function(data) {
    callback(data[app]);
  });
}

function resetSyncedFlags(app) {
  chrome.storage.sync.remove(app);
}