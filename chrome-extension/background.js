var connections = {};
var dataCache = {};
chrome.runtime.onConnect.addListener(function (port) {
  var extensionListener = function (message, sender, sendResponse) {
    switch (message.name) {
      case "init":
        connections[message.tabId] = port;
        if(dataCache[message.tabId]) {
          connections[message.tabId].postMessage(dataCache[message.tabId]);
        }
        break;
      case "update":
        var msg = {
          'status': 'update',
          'payload': message.data,
          'app': message.app
        };
        sendUpdateToPage(message.tabId, msg);
        break;
      case "reset":
        sendUpdateToPage(message.tabId, {status: 'reset', app: message.app});
        break;
    }
  };

  // Listen to messages sent from the DevTools page
  port.onMessage.addListener(extensionListener);

  port.onDisconnect.addListener(function(port) {
    port.onMessage.removeListener(extensionListener);

    var tabs = Object.keys(connections);
    for (var i=0, len=tabs.length; i < len; i++) {
      if (connections[tabs[i]] === port) {
        delete connections[tabs[i]];
        break;
      }
    }
  });
});

function sendUpdateToPage(tabId, data) {
    chrome.tabs.sendMessage(tabId, data, null);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Messages from content scripts should have sender.tab set
  if (sender.tab) {
    var tabId = sender.tab.id;
    if (tabId in connections) {
      connections[tabId].postMessage(request);
    }
    dataCache[sender.tab.id] = request;
  }
  return true;
});