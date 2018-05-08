window['__es_featureFlags'] = {
  _extensionReady: function(version, localData) {
    window['__es_featureFlags']._extensionConnected = true;
    window['__es_featureFlags']._extensionVersion = version;
    window['__es_featureFlags']._setupLocalFlags(localData);
    window['__es_featureFlags']._sendDataToExtension("setup", window['__es_featureFlags']._availableFlags);
  },
  _setupLocalFlags: function(localData) {
    for(var key in localData) {
      for(var i = 0; i < this._availableFlags.length; i++) {
        if(key === this._availableFlags[i].id) {
          this._availableFlags[i].default = localData[key];
        }
      }
    }
  },
  _valueUpdated: function(data) {
    for(var i = 0; i < this._availableFlags.length; i++) {
      if(data.id === this._availableFlags[i].id) {
        this._sendEvent('change', data.id, new CustomEvent('change', {'detail': {
          'flag': data.id,
          'newValue': data.value,
          'oldValue': this._availableFlags[i].default,
          'timestamp': new Date().getTime()
        }}));
        this._availableFlags[i].default = data.value;
        break;
      }
    }
  },
  _sendEvent: function(type, flag, evt) {
    var i;
    if(this._listeners.flag[flag] && this._listeners.flag[flag][type]) {
      for(i = 0; i < this._listeners.flag[flag][type].length; i++) {
        this._listeners.flag[flag][type][i](evt);
      }
    }
    if(this._listeners.generic[type]) {
      for(i = 0; i < this._listeners.generic[type].length; i++) {
        this._listeners.generic[type][i]();
      }
    }
  },
  _resetValues: function() {
    for(var i = 0; i < this._availableFlags.length; i++) {
      for(var j = 0; j < this.flags.length; j++) {
        if(this.flags[j].id === this._availableFlags[i].id &&
          this.flags[j].default !== this._availableFlags[i].default) {
          this._sendEvent('change', this.flags[j].id, new CustomEvent('change', {'detail': {
              'flag': this.flags[j].id,
              'newValue': this.flags[j].default,
              'oldValue': this._availableFlags[i].default,
              'timestamp': new Date().getTime()
            }}));
          this._availableFlags[i].default = this.flags[j].default;
        }
      }
    }
    window['__es_featureFlags']._sendDataToExtension("setup", window['__es_featureFlags']._availableFlags);
  },
  _listeners: {
    generic: {},
    flag: {}
  },
  version: '0.0.1',
  _extensionConnected: false,
  _extensionVersion: null,
  isReady: false,
  _availableFlags: [],
  _sendDataToExtension: function(action, data) {
    window.postMessage({ type: "__ES_FEATUREFLAGS_APP", action: action, payload: data }, "*");
  },
  addEventListener: function(type, eventCallback) {
    if(type.indexOf(':') > -1) {
      var parts = type.split(':');
      type = parts[0];
      var flag = parts[1];
      if(!this._listeners.flag[flag]) {
        this._listeners.flag[flag] = {};
      }
      if(!this._listeners.flag[flag][type]) {
        this._listeners.flag[flag][type] = [];
      }
      this._listeners.flag[flag][type].push(eventCallback);
    } else {
      if(!this._listeners.generic[type]) {
        this._listeners.generic[type] = [];
      }
      this._listeners.generic[type].push(eventCallback);
    }
  },
  removeEventListener: function(type, eventCallback) {
    if(type.indexOf(':')) {
      var parts = type.split(':');
      type = parts[0];
      var flag = parts[1];
      if(!this._listeners.flag[flag]) {
        this._listeners.flag[flag] = {};
      }
      if(!this._listeners.flag[flag][type]) {
        this._listeners.flag[flag][type] = [];
      }
      var remove = -1;
      for(var i = 0; i < this._listeners.flag[flag][type].length; i++) {
        if(this._listeners.flag[flag][type].toString() === eventCallback.toString()) {
          remove = i;
          break;
        }
      }
      if(remove > -1) {
        this._listeners.flag[flag][type].splice(remove, 1);
      }
    } else {
      if(!this._listeners.generic[type]) {
        this._listeners.generic[type] = {};
      }
      var remove = -1;
      for(var i = 0; i < this._listeners.generic[type].length; i++) {
        if(this._listeners.generic[type].toString() === eventCallback.toString()) {
          remove = i;
          break;
        }
      }
      if(remove > -1) {
        this._listeners.generic[type].splice(remove, 1);
      }
    }
  },
  getFlag(id) {
    if(!window['__es_featureFlags'].isReady)
      throw new Error("Feature flags is not yet in the ready state, please listen for the 'ready' event");
    for(var i = 0; i < this._availableFlags.length; i++) {
      if(id === this._availableFlags[i].id) {
        return this._availableFlags[i].default;
      }
    }
    throw new Error('No flag with id: ' + id + ' was found, have you set it up in the flags console');
  },
  initialize: function() {
    window.addEventListener("message", function(event) {
      if (event.source != window)
        return;
      if (event.data.type && (event.data.type == "__ES_FEATUREFLAGS_EXTENSION")) {
        switch(event.data.status) {
          case "ready":
            window['__es_featureFlags']._extensionReady(event.data.version, event.data.local);
            break;
          case "update":
            window['__es_featureFlags']._valueUpdated(event.data.payload);
            break;
          case "reset":
            window['__es_featureFlags']._resetValues();
            break;
        }
      }
    });

    window['__es_featureFlags']._availableFlags = JSON.parse(JSON.stringify(window['__es_featureFlags'].flags));
    console.log(window['__es_featureFlags']._availableFlags);
    window['__es_featureFlags']._sendDataToExtension("ready", {version: window['__es_featureFlags'].version});

    if(document.readyState === 'complete') {
      setTimeout(function () {
        window['__es_featureFlags'].isReady = true;
        if (window['__es_featureFlags']._listeners.generic['ready']) {
          for(var i = 0; i < window['__es_featureFlags']._listeners.generic['ready'].length; i++) {
            window['__es_featureFlags']._listeners.generic['ready'][i](new Event('ready'));
          }
        }
      }, 60);
    } else {
      window.onload = function() {
        setTimeout(function () {
          window['__es_featureFlags'].isReady = true;
          if (window['__es_featureFlags']._listeners.generic['ready']) {
            for(var i = 0; i < window['__es_featureFlags']._listeners.generic['ready'].length; i++) {
              window['__es_featureFlags']._listeners.generic['ready'][i](new Event('ready'));
            }
          }
        }, 60);
      };
    }
  }
};

window['__es_featureFlags'].flags = [
  {
    id: 'test-flag',
    type: 'bool',
    name: 'Test Flag',
    description: 'Flag Description text goes here, it will most likely be a little long, but not too long',
    default: false
  },
  {
    id: 'test-flag-2',
    type: 'bool',
    name: 'Test Flag 2',
    description: 'This one doesn\'t have such a long description',
    default: true
  }
];

window['__es_featureFlags'].initialize();