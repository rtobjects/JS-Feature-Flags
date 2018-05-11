var ui = {
  binder: {
    applications: [],
    application: {},
    changed: false
  },
  _accessToken: {
    token: null,
    expires: null
  },
  _auth: {
    id: 'oauthID',
    redirect: "//testserver.com/authorized.html"
  },
  domain: 'testserver.com',
  getApplications: function(callback) {
    ui._ContentCall('/rest/apps', 'GET', null, function(data) {
      ui.binder.applications = data;
      if(callback) {
        callback();
      }
    }, function() {
      //FAILED
    });
  },
  getApplication: function(id) {
    ui._ContentCall('/rest/apps/' + id, 'GET', null, function(data) {
      ui.binder.application = data;
    }, function() {
      ui.binder.application = {};
    });
  },
  updateApplication: function(id, data) {
    ui._ContentCall('/rest/apps/' + id, 'PUT', data, function(data) {
      console.log("update complete");
    }, function() {
      console.log("Save Error");
    });
  },
  newApplication: function(name, domain) {
    ui._ContentCall('/rest/apps/', 'POST', {name: name, domains: [domain]}, function(data) {
        window.location.hash = "#" + data.id;
        ui.getApplications(function() {
          ui.getApplication(data.id);
        });
    }, function() {
      console.log("Save Error");
    });
  },
  _ContentCall: function(url, method, data, complete, failed) {
    ui._getAccessToken(function(token) {
      var opts = {
        url: url,
        method: method,
        contentType: 'JSON',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      };
      if(data) {
        opts.body = JSON.stringify(data);
      }
      nanoajax.ajax(opts, function (code, response) {
        if (code >= 200 && code < 300) {
          complete(JSON.parse(response));
        } else {
          failed();
        }
      });
    }, failed);
  },
  _getAccessToken: function(complete, failed) {
    if(!ui._checkAccessTokenValidity()) {
      if(!ui._accessToken.inProgress) {
        ui._accessToken.inProgress = true;
        var frame = document.createElement('iframe');

        frame.style.border = 'none';
        frame.style.position = 'fixed';
        frame.style.top = '0';
        frame.style.right = '0';
        frame.style.bottom = '0';
        frame.style.left = '0';
        frame.style.width = '100%';
        frame.style.height = '100%';
        frame.style.zIndex = '999999';

        //TODO: add in generic oauth server here
        frame.src = "oauthServerAddress?client_id=" + ui._auth.id + "&response_type=token&scope=featureFlags&redirect_uri=" + ui._auth.redirect;

        document.body.appendChild(frame);

        frame.addEventListener('load', function (e) {
          try {
            if(frame.contentDocument.location.href.indexOf(ui._auth.redirect) === 0) {
              try {
                delete ui._accessToken.inProgress;
                ui._accessToken = frame.contentWindow.getToken();
                complete(ui._accessToken.token);
                document.body.removeChild(frame);
              } catch(e) {
                console.error(e);
                failed();
                delete ui._accessToken.inProgress;
              }
            }
          } catch(e) {}
        });
      }
    } else {
      complete(ui._accessToken.token);
    }
  },
  _checkAccessTokenValidity: function() {
    return ui._accessToken.token && ui._accessToken.expires && ui._accessToken.expires > new Date().getTime();
  },
  initialise: function() {
    if(window.location.hostname !== ui.domain) {
      window.location.href = window.location.protocol + '//' + ui.domain + window.location.pathname + window.location.hash;
      return;
    }
    rivets.formatters.prepend = function(value, prefix){
      return prefix + value;
    };
    rivets.bind(document.body, ui.binder);
    ui.getApplications();
    ui.routing();

    ui.binder.methods = {
      appUpdate: ui.appUpdate,
      newAppDialog: ui.openNewAppDialog,
      newFlagDialog: ui.openNewFlagDialog,
      closeDialog: ui.closeDialog,
      saveFlag: ui.saveFlag,
      saveApp: ui.saveApp,
      newDomain: ui.newDomain,
      domainUpdate: ui.domainUpdate
    }
  },
  appUpdate: function() {
    ui.updateApplication(ui.binder.application.id, ui.binder.application);
  },
  domainUpdate: function(e, m) {
    var domains = document.querySelectorAll(".appinfo .domain-input");
    for(var i = 0; i < domains.length; i++) {
      if(ui.binder.application.domains[i] !== undefined) {
        ui.binder.application.domains[i] = domains[i].value;
      }
    }
    ui.appUpdate();
  },
  newDomain: function() {
    if(ui.binder.application.id) {
      ui.binder.application.domains.push('');
    }
  },
  openNewFlagDialog: function() {
    ui.closeDialog();
    document.querySelector(".modal.new-flag").className =
      document.querySelector(".modal.new-flag").className.replace(' hidden', '') + ' visible';
    ui.binder.UpdateError = null;
    document.querySelector(".modal.new-flag .name").value = '';
    document.querySelector(".modal.new-flag .description").value = '';
    document.querySelector(".modal.new-flag .id").value = '';
  },
  openNewAppDialog: function() {
    ui.closeDialog();
    document.querySelector(".modal.new-app").className =
      document.querySelector(".modal.new-app").className.replace(' hidden', '') + ' visible';
    ui.binder.UpdateError = null;
    document.querySelector(".modal.new-app .name").value = '';
    document.querySelector(".modal.new-app .domain").value = '';
  },
  closeDialog: function() {
    if(document.querySelector(".modal.visible")) {
      document.querySelector(".modal.visible").className =
        document.querySelector(".modal.visible").className.replace(' visible', '') + ' hidden';
    }
  },
  saveFlag: function() {
    var name = document.querySelector(".modal.new-flag .name").value;
    var description = document.querySelector(".modal.new-flag .description").value;
    var id = document.querySelector(".modal.new-flag .id").value.toLowerCase();

    if(name.length < 2 || name.length > 32) {
      //TODO: Throw Error
      ui.binder.UpdateError = "Name must be at least 2 characters and no more than 32";
      return;
    }

    if(description.length < 5) {
      //TODO: Throw Error
      ui.binder.UpdateError = "Description must be at least 5 characters";
      return;
    }

    if(id.length < 5) {
      //TODO: Throw Error
      ui.binder.UpdateError = "ID must be at least 5 characters";
      return;
    }

    if(id.indexOf(' ') > -1) {
      //TODO: Throw Error (not allowed spaces)
      ui.binder.UpdateError = "ID must not contain space characters";
      return;
    }

    for(var i = 0; i < ui.binder.application.flags.length; i++) {
      if(ui.binder.application.flags[i].id === id) {
        //TODO: Throw Error (ID exists)
        ui.binder.UpdateError = "ID must be unique in this application (not case sensitive)";
        return;
      }
    }

    ui.binder.application.flags.push(
      {
        id: id,
        name: name,
        description: description
      }
    );

    ui.binder.UpdateError = null;

    ui.updateApplication(ui.binder.application.id, ui.binder.application);
    ui.closeDialog();
  },
  saveApp: function() {
    var name = document.querySelector(".modal.new-app .name").value;
    var domain = document.querySelector(".modal.new-app .domain").value;

    if(name.length < 2 || name.length > 32) {
      //TODO: Throw Error
      ui.binder.UpdateError = "Name must be at least 2 characters and no more than 32";
      return;
    }

    if(domain.length < 3 || domain.length > 64) {
      //TODO: Throw Error
      ui.binder.UpdateError = "Domain must be at least 2 characters and no more than 64";
      return;
    }

    ui.binder.UpdateError = null;
    ui.newApplication(name, domain);
    ui.closeDialog();
  },
  routing: function() {
    window.addEventListener('hashchange', function(e) {
      ui.followRoute(window.location.hash);
    });

    if(window.location.hash) {
      ui.followRoute(window.location.hash);
    }
  },
  followRoute: function(hash) {
    var parts = hash.replace('#', '').split('/');
    if(parts.length > 0) {
      ui.getApplication(parts[0]);
    }
  }
};

ui.initialise();