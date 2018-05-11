var binder = {
  flags: [],
  onChange: onChange,
  application: null
};
var backgroundPageConnection;

function websiteHasFunctionality(data) {
  binder.flags = data.flags;
  binder.application = data.application;

  document.querySelector(".disabled").className += ' hidden';
  var table = document.querySelector(".flagsTable");
  table.className = table.className.replace(' hidden', '');

  document.querySelector('#reset').addEventListener('click', resetData);
}

function onChange(e, model) {
  updateValue(model.flag.id, model.flag.default);
}

function updateValue(id, value) {
  backgroundPageConnection.postMessage({
    name: 'update',
    tabId: chrome.devtools.inspectedWindow.tabId,
    app: binder.application.id,
    data: {
      id: id,
      value: value
    }
  });
}

function resetData() {
  backgroundPageConnection.postMessage({
    name: 'reset',
    tabId: chrome.devtools.inspectedWindow.tabId,
    app: binder.application.id
  });
}

function InitialisePanel() {
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request);
    if (sender.tab.id === chrome.devtools.inspectedWindow.tabId) {
      if (request.type === '__ES_FEATUREFLAGS_APP') {
        switch (request.action) {
          case "setup":
            websiteHasFunctionality(request.payload);
            break;
        }
      }
    }
  });

  rivets.bind(document.body, binder);

  // Create a connection to the background page
  backgroundPageConnection = chrome.runtime.connect({
    name: "panel"
  });

  backgroundPageConnection.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId
  }, function(response) {
    console.log(response);
  });
}


InitialisePanel();