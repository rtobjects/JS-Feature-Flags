var ui = {
  binder: {
    applications: [],
    application: {},
    changed: false,
    flagUpdate: function() {
      ui.updateApplication(ui.binder.application.id, ui.binder.application);
    }
  },
  getApplications: function() {
    nanoajax.ajax({
      url: 'api.php?list=apps',
      method: 'GET',
      contentType: 'JSON'
    }, function (code, response) {
      if (code >= 200 && code < 300) {
        ui.binder.applications = JSON.parse(response);
      }
    });
  },
  getApplication: function(id) {
    nanoajax.ajax({
      url: 'api.php?app=' + id,
      method: 'GET',
      contentType: 'JSON'
    }, function (code, response) {
      if (code >= 200 && code < 300) {
        ui.binder.application = JSON.parse(response);
      } else {
        ui.binder.application = {};
      }
    });
  },
  updateApplication: function(id, data) {
    nanoajax.ajax({
      url: 'api.php?app=' + id,
      method: 'PUT',
      body: JSON.stringify(data),
      contentType: 'JSON'
    }, function (code, response) {
      if (code >= 200 && code < 300) {
        alert(saved);
      }
    });
  },
  newApplication: function(name, domains) {

  },
  initialise: function() {
    rivets.formatters.prepend = function(value, prefix){
      return prefix + value;
    };
    rivets.bind(document.body, ui.binder);
    ui.getApplications();
    ui.routing();

    document.querySelector(".fab").addEventListener('click', function() {
      document.querySelector(".modal").className = document.querySelector(".modal").className.replace(' hidden', '');
      ui.binder.UpdateError = null;
      document.querySelector(".modal .name").value = '';
      document.querySelector(".modal .description").value = '';
      document.querySelector(".modal .id").value = '';
    });

    document.querySelector(".modal .md-back").addEventListener('click', function() {
      document.querySelector(".modal").className += ' hidden';
    });
    document.querySelector(".modal .md-save").addEventListener('click', function() {
      /*document.querySelector(".modal").className += ' hidden';*/
      var name = document.querySelector(".modal .name").value;
      var description = document.querySelector(".modal .description").value;
      var id = document.querySelector(".modal .id").value.toLowerCase();

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

      document.querySelector(".modal").className += ' hidden';
      ui.updateApplication(ui.binder.application.id, ui.binder.application);
    });
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