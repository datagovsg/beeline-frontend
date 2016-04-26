import querystring from 'querystring';
import uuid from 'uuid';
import requestingVerificationCodeTemplate from '../templates/requesting-verification-code.html';
import sendingVerificationCodeTemplate from '../templates/sending-verification-code.html';

export default function UserService($http, $state, $ionicPopup, $ionicLoading) {

  var sessionToken = window.localStorage['sessionToken'] || null;

  // Requests a verification code to log in
  var sendTelephoneVerificationCode = function(number) {
    return instance.beeline({
      method: 'POST',
      url: '/users/sendTelephoneVerification',
      data: { 'telephone': '+65' + number },
      headers: { 'Content-Type': 'application/json' }
    }).then(function(response) {
      return true;
    });
  };

  // Submit the received code for verification
  var verifyTelephone = function(telephoneNumber, code) {
    return instance.beeline({
      method: 'POST',
      url: '/users/verifyTelephone?' + querystring.stringify({
        telephone: '+65' + telephoneNumber,
        code: code
      })
    })
    .then(function(response) {
      sessionToken = response.data.sessionToken;
      window.localStorage.setItem('sessionToken', sessionToken);
      instance.user = response.data.user;
      window.localStorage.setItem('beelineUser', JSON.stringify(instance.user));
      return instance.user;
    });
  };

  // Prompts the user for a phone number to send a verification code
  // Reprompts the user if the number given isnt a valid 8 digit string
  // Returns a promise for the telephone number if successful
  var VALID_PHONE_REGEX = /^[0-9]{8}$/; 
  var promptForPhone = function(message) {
    return $ionicPopup.prompt({
      title: 'Add your phone number',
      subTitle: message,
      inputPlaceholder: 'e.g. 87654321'
    })        
    // Need to explicitly check for undefined to distinguish between empty string
    // and an actual cancel
    .then(function(response) { if (typeof response !== 'undefined') {
      // If phone number is tested valid locally then transmit to server
      if (VALID_PHONE_REGEX.test(response)) {
        var telephone = response;
        $ionicLoading.show({ template: requestingVerificationCodeTemplate });
        return sendTelephoneVerificationCode(telephone)
        .then(function() { 
          $ionicLoading.hide();
          return Promise.resolve(telephone); 
        })
        // If an error occurs close the loading dialogue before rethrowing it 
        .catch(function(error) {
          $ionicLoading.hide();
          return Promise.reject(error);
        });
      }
      // Reprompt with a message if the number given is invalid
      else return promptForPhone("Please enter a valid 8 digit mobile number");
    }});
  };

  // Prompt the user to enter the verification code sent to the given phone number
  // Reprompts the user if the number given isnt a valid 6 digit string
  var VALID_VERIFICATION_CODE_REGEX = /^[0-9]{6}$/; 
  var promptForVerification = function(telephone, message) {
    return $ionicPopup.prompt({
      title: 'Verification Code',
      subTitle: message,
      inputPlaceholder: 'e.g. 123456'
    })        
    // Need to explicitly check for undefined to distinguish between empty string
    // and an actual cancel
    .then(function(response) { if (typeof response !== 'undefined') {
      if (VALID_VERIFICATION_CODE_REGEX.test(response)) {
        var verificationCode = response;
        $ionicLoading.show({ template: sendingVerificationCodeTemplate });
        return verifyTelephone(telephone, verificationCode)
        .then(function() { 
          $ionicLoading.hide();
          return Promise.resolve(verificationCode); 
        })
        // If an error occurs close the loading dialogue before rethrowing it 
        .catch(function(error) {
          $ionicLoading.hide();
          return Promise.reject(error);
        });
      }
      else return promptForVerification(telephone, "Please enter a valid 6 digit code");       
    }});
  };

  var instance = {
    // If user data is set then user is logged in
    // If its null the user is logged out
    user: window.localStorage['beelineUser'] ?
          JSON.parse(window.localStorage['beelineUser']) : null,

    // General purpose wrapper for making http requests to server
    // Adds the appropriate http headers and token if signed in
    beeline(options) {
      options.url = 'http://staging.beeline.sg' + options.url;
      options.headers = options.headers || {};
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
        window.localStorage.uuid = window.localStorage.uuid || uuid.v4();
        options.headers['Beeline-Device-UUID'] = window.localStorage.uuid;
        options.headers['Beeline-Device-Model'] = window.navigator.userAgent;
        options.headers['Beeline-Device-Platform'] = 'Browser';
      }
      return $http(options);
    },

    // Prepares an update of the telephone number
    // The returned update toke is used together with the verification number
    // @returns Promise.<update token>
    requestUpdateTelephone: function(telephone) {
      return instance.beeline({
        url: '/user/requestUpdateTelephone',
        method: 'POST',
        data: { newTelephone: '+65' + telephone }
      })
      .then(function(response) { return response.data.updateToken; });
    },

    // Really tell the server to update the telephone
    // number. Pass this function the updateToken returned by
    // requestUpdateTelephone and the verification key received
    // by SMS
    updateTelephone: function(updateToken, verificationKey) {
      return instance.beeline({
        url: '/user/updateTelephone',
        method: 'POST',
        data: {
          code: verificationKey,
          updateToken: updateToken
        }
      })
      .then(function(reponse) {
        instance.user = reponse.data;
        window.localStorage.setItem('beelineUser', JSON.stringify(instance.user));
        return instance.user;
      });
    },

    // Updates user fields
    updateUserInfo: function(update) {
      return instance.beeline({
        method: 'PUT',
        url: '/user',
        data: update,
      })
      .then(function(response) {
        instance.user = response.data;
        return instance.user;
      });
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
      return Promise.resolve();
    },

    // Prompt the user for the phone number and login verification code
    logIn: function() {
      return promptForPhone("Please enter your mobile number to receive a verification code")
      .then(function(telephone) {
        promptForVerification(telephone, 'Enter the 6 digit code sent to ' + telephone);
      })
      .then(function() { return Promise.resolve() })
      .catch(function(error) {
        $ionicPopup.alert({
          title: "Error when trying to connect to server",
          subTitle: error
        });
      });
    }

  };

  instance.verifySession();
  return instance;
}
