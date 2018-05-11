var __rto_featureFlags = {
  _extensionReady: function(version, localData) {
    __rto_featureFlags._extensionConnected = true;
    __rto_featureFlags._extensionVersion = version;
    __rto_featureFlags._setupLocalFlags(localData);
    __rto_featureFlags._sendDataToExtension('setup', {'flags': __rto_featureFlags._availableFlags, 'application': __rto_featureFlags['application']});
  },
  _setupLocalFlags: function(localData) {
    for(var key in localData) {
      for(var i = 0; i < __rto_featureFlags._availableFlags.length; i++) {
        if(key === __rto_featureFlags._availableFlags[i].id) {
          __rto_featureFlags._availableFlags[i].default = localData[key];
        }
      }
    }
  },
  _valueUpdated: function(data) {
    for(var i = 0; i < __rto_featureFlags._availableFlags.length; i++) {
      if(data.id === __rto_featureFlags._availableFlags[i]['id']) {
        __rto_featureFlags._sendEvent('change', data.id, new CustomEvent('change', {'detail': {
          'flag': data['id'],
          'newValue': data['value'],
          'oldValue': __rto_featureFlags._availableFlags[i]['default'],
          'timestamp': new Date().getTime()
        }}));
        __rto_featureFlags._availableFlags[i]['default'] = data['value'];
        break;
      }
    }
  },
  _sendEvent: function(type, flag, evt) {
    var i;
    if(__rto_featureFlags._listeners.flag[flag] && __rto_featureFlags._listeners.flag[flag][type]) {
      for(i = 0; i < __rto_featureFlags._listeners.flag[flag][type].length; i++) {
        __rto_featureFlags._listeners.flag[flag][type][i](evt);
      }
    }
    if(__rto_featureFlags._listeners.generic[type]) {
      for(i = 0; i < __rto_featureFlags._listeners.generic[type].length; i++) {
        __rto_featureFlags._listeners.generic[type][i]();
      }
    }
  },
  _resetValues: function() {
    for(var i = 0; i < __rto_featureFlags._availableFlags.length; i++) {
      for(var j = 0; j < __rto_featureFlags['flags'].length; j++) {
        if(__rto_featureFlags['flags'][j]['id'] === __rto_featureFlags._availableFlags[i]['id'] &&
          __rto_featureFlags['flags'][j]['default'] !== __rto_featureFlags._availableFlags[i]['default']) {
          __rto_featureFlags._sendEvent('change', __rto_featureFlags['flags'][j].id, new CustomEvent('change', {'detail': {
              'flag': __rto_featureFlags['flags'][j]['id'],
              'newValue': __rto_featureFlags['flags'][j]['default'],
              'oldValue': __rto_featureFlags._availableFlags[i]['default'],
              'timestamp': new Date().getTime()
            }}));
          __rto_featureFlags._availableFlags[i]['default'] = __rto_featureFlags['flags'][j]['default'];
        }
      }
    }
    __rto_featureFlags._sendDataToExtension('setup', {'flags': __rto_featureFlags._availableFlags, 'application': __rto_featureFlags['application']});
  },
  _listeners: {
    generic: {},
    flag: {}
  },
  'version': '0.0.1',
  _extensionConnected: false,
  _extensionVersion: null,
  'isReady': false,
  _availableFlags: [],
  _sendDataToExtension: function(action, data) {
    window.postMessage({'type': '__ES_FEATUREFLAGS_APP', 'action': action, 'payload': data}, '*');
  },
  'addEventListener': function(type, eventCallback) {
    if(type.indexOf(':') > -1) {
      var parts = type.split(':');
      type = parts[0];
      var flag = parts[1];
      if(!__rto_featureFlags._listeners.flag[flag]) {
        __rto_featureFlags._listeners.flag[flag] = {};
      }
      if(!__rto_featureFlags._listeners.flag[flag][type]) {
        __rto_featureFlags._listeners.flag[flag][type] = [];
      }
      __rto_featureFlags._listeners.flag[flag][type].push(eventCallback);
    } else {
      if(!__rto_featureFlags._listeners.generic[type]) {
        __rto_featureFlags._listeners.generic[type] = [];
      }
      __rto_featureFlags._listeners.generic[type].push(eventCallback);
    }
  },
  'removeEventListener': function(type, eventCallback) {
    if(type.indexOf(':')) {
      var parts = type.split(':');
      type = parts[0];
      var flag = parts[1];
      if(!__rto_featureFlags._listeners.flag[flag]) {
        __rto_featureFlags._listeners.flag[flag] = {};
      }
      if(!__rto_featureFlags._listeners.flag[flag][type]) {
        __rto_featureFlags._listeners.flag[flag][type] = [];
      }
      var remove = -1;
      for(var i = 0; i < __rto_featureFlags._listeners.flag[flag][type].length; i++) {
        if(__rto_featureFlags._listeners.flag[flag][type].toString() === eventCallback.toString()) {
          remove = i;
          break;
        }
      }
      if(remove > -1) {
        __rto_featureFlags._listeners.flag[flag][type].splice(remove, 1);
      }
    } else {
      if(!__rto_featureFlags._listeners.generic[type]) {
        __rto_featureFlags._listeners.generic[type] = {};
      }
      var remove = -1;
      for(var i = 0; i < __rto_featureFlags._listeners.generic[type].length; i++) {
        if(__rto_featureFlags._listeners.generic[type].toString() === eventCallback.toString()) {
          remove = i;
          break;
        }
      }
      if(remove > -1) {
        __rto_featureFlags._listeners.generic[type].splice(remove, 1);
      }
    }
  },
  'getFlag': function(id) {
    if(!__rto_featureFlags.isReady)
      throw new Error('Feature flags is not yet in the ready state, please listen for the \'ready\' event');
    for(var i = 0; i < __rto_featureFlags._availableFlags.length; i++) {
      if(id === __rto_featureFlags._availableFlags[i].id) {
        return __rto_featureFlags._availableFlags[i].default;
      }
    }
    throw new Error('No flag with id: ' + id + ' was found, have you set it up in the flags console');
  },
  'initialize': function() {
    if(__rto_featureFlags['application']['domains'].indexOf(window.location.hostname) < 0) {
      console.warn('Feature Flags Application: \'' + __rto_featureFlags['application']['name']
        + '\' is not enabled for domain: \'' + window.location.hostname + '\'');
      return;
    }
    window.addEventListener('message', function(event) {
      if (event.source !== window)
        return;
      if (event.data.type && (event.data.type === '__ES_FEATUREFLAGS_EXTENSION')) {
        switch(event.data.status) {
          case 'ready':
            __rto_featureFlags._extensionReady(event['data']['version'], event['data']['local']);
            break;
          case 'update':
            __rto_featureFlags._valueUpdated(event['data']['payload']);
            break;
          case 'reset':
            __rto_featureFlags._resetValues();
            break;
        }
      }
    });

    __rto_featureFlags._availableFlags = JSON.parse(JSON.stringify(__rto_featureFlags['flags']));
    __rto_featureFlags._sendDataToExtension('ready', {'version': __rto_featureFlags.version, 'application': __rto_featureFlags['application']});

    if(document.readyState === 'complete') {
      setTimeout(function () {
        __rto_featureFlags.isReady = true;
        if (__rto_featureFlags._listeners.generic['ready']) {
          for(var i = 0; i < __rto_featureFlags._listeners.generic['ready'].length; i++) {
            __rto_featureFlags._listeners.generic['ready'][i](new Event('ready'));
          }
        }
      }, 60);
    } else {
      window.onload = function() {
        setTimeout(function () {
          __rto_featureFlags.isReady = true;
          if (__rto_featureFlags._listeners.generic['ready']) {
            for(var i = 0; i < __rto_featureFlags._listeners.generic['ready'].length; i++) {
              __rto_featureFlags._listeners.generic['ready'][i](new Event('ready'));
            }
          }
        }, 60);
      };
    }
  }
};

window['rtoFeatureFlags'] = __rto_featureFlags;