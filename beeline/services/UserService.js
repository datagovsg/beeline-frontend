/* eslint-env node, mocha */
import querystring from 'querystring';
import uuid from 'uuid';
import requestingVerificationCodeTemplate from '../templates/requesting-verification-code.html';
import sendingVerificationCodeTemplate from '../templates/sending-verification-code.html';

export default function UserService($http, $state, $ionicPopup, $ionicLoading) {

  // ////////////////////////////////////////////////////////////////////////////
  // Private internal methods and variables
  // ////////////////////////////////////////////////////////////////////////////
  var VALID_PHONE_REGEX = /^[0-9]{8}$/;
  var VALID_VERIFICATION_CODE_REGEX = /^[0-9]{6}$/;
  var sessionToken = window.localStorage.sessionToken || null;
  var user = window.localStorage.beelineUser ?
             JSON.parse(window.localStorage.beelineUser) : null;

  // General purpose wrapper for making http requests to server
  // Adds the appropriate http headers and token if signed in
  var beelineRequest = function(options) {
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
  };

  // Requests a verification code to be sent to a mobile number
  // Verification code is used to log in
  var sendTelephoneVerificationCode = function(number) {
    return beelineRequest({
      method: 'POST',
      url: '/users/sendTelephoneVerification',
      data: {telephone: '+65' + number},
      headers: {'Content-Type': 'application/json'}
    }).then(function() {
      return true;
    });
  };

  // Submit the received code and number for verification to the server
  var verifyTelephone = function(telephoneNumber, code) {
    return beelineRequest({
      method: 'POST',
      url: '/users/verifyTelephone?' + querystring.stringify({
        telephone: '+65' + telephoneNumber,
        code: code
      })
    })
    .then(function(response) {
      sessionToken = response.data.sessionToken;
      window.localStorage.setItem('sessionToken', sessionToken);
      user = response.data.user;
      window.localStorage.setItem('beelineUser', JSON.stringify(user));
      return user;
    });
  };

  // Prepares an update of the telephone number
  // The returned update toke is used together with the verification number
  // @returns Promise.<update token>
  var requestUpdateTelephone = function(telephone) {
    return beelineRequest({
      url: '/user/requestUpdateTelephone',
      method: 'POST',
      data: {newTelephone: '+65' + telephone}
    })
    .then(function(response) {
      return response.data.updateToken;
    });
  };

  // Really tell the server to update the telephone
  // number. Pass this function the updateToken returned by
  // requestUpdateTelephone and the verification key received
  // by SMS
  var updateTelephone = function(updateToken, verificationKey) {
    return beelineRequest({
      url: '/user/updateTelephone',
      method: 'POST',
      data: {
        code: verificationKey,
        updateToken: updateToken
      }
    })
    .then(function(reponse) {
      user = reponse.data;
      window.localStorage.setItem('beelineUser', JSON.stringify(user));
      return user;
    });
  };

  // Updates user fields
  var updateUserInfo = function(update) {
    return beelineRequest({
      method: 'PUT',
      url: '/user',
      data: update
    })
    .then(function(response) {
      user = response.data;
      return user;
    });
  };

  var logOut = function() {
    sessionToken = null;
    user = null;
    delete window.localStorage.sessionToken;
    delete window.localStorage.beelineUser;
    return Promise.resolve();
  };

  // Queries the server to test if the session is still valid
  // Updates the user info if necessary
  // If the session is invalid then log out
  var verifySession = function() {
    return beelineRequest({
      url: '/user',
      method: 'GET'
    })
    .then(function(response) {
      user = response.data;
      return true;
    }, function(error) {
      logOut();
      return false;
    });
  };

  // Prompts the user for a phone number to send a verification code
  // Reprompts the user if the number given isnt a valid 8 digit string
  // Returns a promise for the telephone number if successful
  var promptForPhone = function(message) {
    return $ionicPopup.prompt({
      title: 'Add your phone number',
      subTitle: message,
      inputPlaceholder: 'e.g. 87654321'
    })
    .then(function(response) {
      // Need to explicitly check for undefined to distinguish between empty string
      // and an actual cancel
      if (typeof response !== 'undefined') {
        // If phone number is tested valid locally then transmit to server
        if (VALID_PHONE_REGEX.test(response)) {
          var telephone = response;
          $ionicLoading.show({template: requestingVerificationCodeTemplate});
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
        return promptForPhone("Please enter a valid 8 digit mobile number");
      }
    });
  };

  // Prompt the user to enter the verification code sent to the given phone number
  // Reprompts the user if the number given isnt a valid 6 digit string
  var promptForVerification = function(telephone, message) {
    return $ionicPopup.prompt({
      title: 'Verification Code',
      subTitle: message,
      inputPlaceholder: 'e.g. 123456'
    })
    // Need to explicitly check for undefined to distinguish between empty string
    // and an actual cancel
    .then(function(response) {
      if (typeof response !== 'undefined') {
        if (VALID_VERIFICATION_CODE_REGEX.test(response)) {
          var verificationCode = response;
          $ionicLoading.show({template: sendingVerificationCodeTemplate});
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
        return promptForVerification(telephone, "Please enter a valid 6 digit code");
      }
    });
  };

  // The combined prompt for phone number and subsequent prompt for verification code
  var promptLogIn = function() {
    return promptForPhone("Please enter your mobile number to receive a verification code")
    .then(function(telephone) {
      if (typeof telephone !== undefined) {
        promptForVerification(telephone, 'Enter the 6 digit code sent to ' + telephone);
      }
    })
    .catch(function(error) {
      $ionicPopup.alert({
        title: "Error when trying to connect to server",
        subTitle: error
      });
    });
  };

  // Similar to prompt for phone but requests an update instead of a log in
  var promptForUpdatePhoneNumber = function(message) {
    return $ionicPopup.prompt({
      title: 'Add your phone number',
      subTitle: message,
      inputPlaceholder: 'e.g. 87654321'
    })
    // Need to explicitly check for undefined to distinguish between empty string
    // and an actual cancel
    .then(function(response) {
      if (typeof response !== 'undefined') {
        // If phone number is tested valid locally then transmit to server
        if (VALID_PHONE_REGEX.test(response)) {
          var telephone = response;
          $ionicLoading.show({template: requestingVerificationCodeTemplate});
          return requestUpdateTelephone(telephone)
          .then(function(token) {
            $ionicLoading.hide();
            return Promise.resolve(token);
          })
          // If an error occurs close the loading dialogue before rethrowing it
          .catch(function(error) {
            $ionicLoading.hide();
            return Promise.reject(error);
          });
        }
        // Reprompt with a message if the number given is invalid
        return promptForUpdatePhoneNumber("Please enter a valid 8 digit mobile number");
      }
    });
  };

  // Smilar to prompt for verification but for updating instead of logging in
  var promptForUpdateVerification = function(token, message) {
    return $ionicPopup.prompt({
      title: 'Verification Code',
      subTitle: message,
      inputPlaceholder: 'e.g. 123456'
    })
    // Need to explicitly check for undefined to distinguish between empty string
    // and an actual cancel
    .then(function(response) {
      if (typeof response !== 'undefined') {
        if (VALID_VERIFICATION_CODE_REGEX.test(response)) {
          var verificationCode = response;
          $ionicLoading.show({template: sendingVerificationCodeTemplate});
          return updateTelephone(token, verificationCode)
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
        return promptForUpdateVerification(token, "Please enter a valid 6 digit code");
      }
    });
  };

  // The combined prompt for phone number and subsequent prompt for verification code
  var promptUpdatePhone = function() {
    return promptForUpdatePhoneNumber("Please enter your mobile number to receive a verification code")
    .then(function(token) {
      if (typeof token !== undefined) {
        promptForUpdateVerification(token, 'Enter the 6 digit code sent to ');
      }
    })
    .catch(function(error) {
      $ionicPopup.alert({
        title: "Error when trying to connect to server",
        subTitle: error
      });
    });
  };

  // Shows a confirmation dialogue asking if the user is sure they want to log out
  var promptLogOut = function() {
    $ionicPopup.confirm({
      title: 'Are you sure you want to sign out?',
      subTitle: "You won't be able to make bookings or see your tickets until you sign in again"
    }).then(function(response) {
      if (response) {
        return logOut();
      }
    });
  };

  // ////////////////////////////////////////////////////////////////////////////
  // Initialization
  // ////////////////////////////////////////////////////////////////////////////
  verifySession();

  // ////////////////////////////////////////////////////////////////////////////
  // Public external interface
  // ////////////////////////////////////////////////////////////////////////////
  return {
    getUser: function() { return (user); },
    beeline: beelineRequest,
    updateUserInfo: updateUserInfo,
    promptLogIn: promptLogIn,
    promptUpdatePhone: promptUpdatePhone,
    promptLogOut: promptLogOut,
    verifySession: verifySession
  };

}
