authenticationHtml = `
  <div id="authentication" class="page-container">
    <h6 class="card-title mt-2">RTL Server URL:</h6>
    <input type="text" class="form-control" id="serverUrl" placeholder="Configure server URL to start quick pay" tabindex="1">
    <p id="configError" class="show-error">Please enter complete url including the protocol (http Or https).</p>
    <p id="configMsg" class="show-config-msg">Server URL configured successfully.</p>
    <div class="d-flex justify-content-start mt-2">
      <button id="configBtn" type="button" class="btn btn-outline-secondary" tabindex="2" disabled>Save URL</button>
    </div><h6 class="card-title mt-2">Password:</h6>
    <input type="password" class="form-control" id="password" placeholder="Password" tabindex="3">
    <div class="d-flex justify-content-start mt-2">
      <button id="authBtn" type="button" class="btn btn-outline-primary" tabindex="4" disabled>Login</button>
    </div>
  </div>`;

let Authentication = function () {
};

Authentication.prototype.initEvents = function () {
  "use strict";
  onPageLoad();

  function onPageLoad() {
    chrome.storage.sync.get('RTL_SERVER_URL', function (storage) {
      if (storage.RTL_SERVER_URL && storage.RTL_SERVER_URL.trim() != '') {
        RTLServerURL = storage.RTL_SERVER_URL;
        $('#serverUrl').val(RTLServerURL);
      } else {
        $('#authBtn').attr('disabled', true);
        $('#password').attr('disabled', true);
      }
    });
  }

  $('#serverUrl').keyup(function () {
    var surl = $('#serverUrl').val();
    if (surl && surl != '') {
      if (!CONSTANTS.REGEX.test(surl)) {
        $('#configError').show('slow');
      } else {
        $('#configError').hide('slow');
        $('#configBtn').removeAttr('disabled');
      }
    } else {
      $('#configBtn').attr('disabled', true);
    }
  });

  $('#configBtn').click(function () {
    var surl = $('#serverUrl').val();
    if (surl.lastIndexOf('/') == (surl.length - 1)) { surl = surl.slice(0, surl.length - 1); }
    if (surl.lastIndexOf('/api') == (surl.length - 4)) { surl = surl.slice(0, surl.length - 4); }
    if (surl.lastIndexOf('/rtl') == (surl.length - 4)) { surl = surl.slice(0, surl.length - 4); }
    chrome.storage.sync.set({ 'RTL_SERVER_URL': surl }, function (storage) {
      RTLServerURL = surl;
      $('#serverUrl').val(surl);
      $('#configMsg').show('slow');
      $('#authBtn').removeAttr('disabled');
      $('#password').removeAttr('disabled');
      setTimeout(() => { $('#configMsg').hide('slow'); }, 2000);
    });
  });

  $('#password').keyup(function () {
    if (!event.altKey && !event.ctrlKey && event.code != 'Tab' && $('#password').val().trim() != '') {
      $('#authBtn').removeAttr('disabled');
    }
  });

  $('#authBtn').click(function () {
    $('#authBtn').html(CONSTANTS.SPINNER_BTN);
    $('#spinnerBtnMsg').text('Logging in...');
    var shaObj = new jsSHA($('#password').val(), 'ASCII');
    var hashedPassword = shaObj.getHash('SHA-256', 'HEX');
    callServerAPI('POST', RTLServerURL + CONSTANTS.AUTH_URL, '', { 'authenticateWith': 'PASSWORD', 'authenticationValue': hashedPassword })
    .then(tokenObjFromAPI => {
      if (tokenObjFromAPI.token) {
        serverToken = tokenObjFromAPI.token;
        loadModule('Payment');
      } else {
        let err = {message: 'Server Connection or Authentication Failed!', error: 'Unable to connect to the server. Please ensure that, server url and password are correct.'};
        loadModule('Error', [err, 'Authentication']);
      }
      $('#authBtn').html('Login');
    })
    .catch(err => {
      $('#authBtn').html('Login');
      loadModule('Error', [err.responseJSON, 'Authentication']);
    });
  });
};

Authentication.prototype.render = function () {
  $('#pageContainer').html(authenticationHtml);
};