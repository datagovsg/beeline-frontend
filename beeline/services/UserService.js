import querystring from 'querystring'
import uuid from 'uuid';

export default function UserService($http, $state, $ionicPopup) {
  var preLoginState = null;
  var preLoginParams = null;
  var userPromise = Promise.resolve(null);
  var sessionToken = window.localStorage['sessionToken'] || null;

  var instance = {
    // If user data is set then user is logged in
    // If its null the user is logged out
    user: window.localStorage['beelineUser'] ? JSON.parse(window.localStorage['beelineUser']) : null,

    // General purpose wrapper for making http requests to server
    // Adds the appropriate http headers and token if signed in
    beeline(options) {
      options.url = 'http://staging.beeline.sg' + options.url;
      options.headers = options.headers || {}
      // Attach the session token if logged in
      if (sessionToken) {
        options.headers.authorization = 'Bearer ' + sessionToken;
      }
      // Attach headers to track execution environment
      if (window.device) {
        options.headers['Beeline-Device-UUID'] = window.device.uuid;
        options.headers['Beeline-Device-Model'] = window.device.model;
        options.headers['Beeline-Device-Platform'] = window.device.platform;
        options.headers['Beeline-Device-Version'] = window.device.version;
        options.headers['Beeline-Device-Manufacturer'] = window.device.manufacturer;
        options.headers['Beeline-Device-Serial'] = window.device.serial;
      }
      else {
        window.localStorage.uuid  = window.localStorage.uuid || uuid.v4();
        options.headers['Beeline-Device-UUID'] = window.localStorage.uuid
        options.headers['Beeline-Device-Model'] = window.navigator.userAgent;
        options.headers['Beeline-Device-Platform'] = 'Browser';
      }
      return $http(options);
    },

    // Requests a verification code to log in 
    sendTelephoneVerificationCode: function(number) {
      return instance.beeline({
        method: 'POST',
        url: '/users/sendTelephoneVerification',
        data: { "telephone": '+65' + number },
        headers: { "Content-Type": 'application/json' }
      });
    },

    // Submit the received code for verification
    verifyTelephone: function(telephoneNumber, code) {
      return instance.beeline({
        method: 'GET', //TODO shouldnt this be post?
        url: '/users/verifyTelephone?' + querystring.stringify({
          telephone: '+65' + telephoneNumber,
          code: code
        })
      })
      .then(function(response) {
				if (response.statusText = 'OK') {
          sessionToken = response.data.sessionToken;
          window.localStorage.setItem('sessionToken', sessionToken);
          instance.user = response.data.user;
          window.localStorage.setItem('beelineUser', JSON.stringify(instance.user));
          return instance.user;
				}
        else return Promise.reject('Verification response not OK');
      })
      .catch(function(error) {
        $ionicPopup.alert('An error occurred while trying to log in');
      });
    },

    /**
    Prepares an update of the telephone number
    The returned update toke is used together with the verification number
    @returns Promise.<update token>
    */
    requestUpdateTelephone: function(telephone) {
      return instance.beeline({
        url: '/user/requestUpdateTelephone',
        method: 'POST',
        data: { newTelephone: '+65' + telephone }
      })
      .then((result) => {
        return result.data.updateToken;
      });
    },

    /**
    Really tell the server to update the telephone
    number. Pass this function the updateToken returned by
    requestUpdateTelephone and the verification key received
    by SMS
    */
    updateTelephone: function (updateToken, verificationKey) {
      return instance.beeline({
        url: '/user/updateTelephone',
        method: 'POST',
        data: {
          code: verificationKey,
          updateToken: updateToken
        }
      })
      .then((userResponse) => {
        instance.user = userResponse.data;
        window.localStorage.setItem('beelineUser', JSON.stringify(instance.user));
        return instance.user;
      })
    },

    // Updates user fields 
    updateUserInfo: function(update) {
      return instance.beeline({
        method: 'PUT',
        url: '/user',
        data: update,
      })
      .then((response) => {
        return instance.user = response.data;
      })
    },

    // Queries the server to test if the session is still valid
    // Updates the user info if necessary
    // If the session is invalid then log out
    verifySession: function() {
      return instance.beeline({
        url: '/user',
        method: 'GET'
      })
      .then(function(response) {
        instance.user = response.data;
        return true;
      }, function(error) {
        instance.logOut();
        return false;
      });
    },

    logOut: function() {
      sessionToken = null;
      instance.user = null;
      delete window.localStorage['sessionToken'];
      delete window.localStorage['beelineUser'];
    },

    // Go to the login page
    // As opposed to a standard ui-sref='login', this
    // method si aves the page. When login is complete it will return there.
    logIn(force) {
      preLoginState = $state.current.name;
      preLoginParams =  $state.params;
      $state.go('login')
    },

    // Return to the page that activated the login
    afterLogin() {
      $state.go(preLoginState || 'tabs.settings', preLoginParams);
      preLoginState = undefined;
    },

    cancelLogin() {
      $state.go(preLoginState, preLoginParams);
      preLoginState = undefined;
    },

  };

  instance.verifySession();
  return instance;
}
