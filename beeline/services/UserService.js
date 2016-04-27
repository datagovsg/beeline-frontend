import querystring from 'querystring';
import uuid from 'uuid';
import requestingVerificationCodeTemplate from '../templates/requesting-verification-code.html';
import sendingVerificationCodeTemplate from '../templates/sending-verification-code.html';
const VALID_PHONE_REGEX = /^[0-9]{8}$/;
const VALID_VERIFICATION_CODE_REGEX = /^[0-9]{6}$/;

export default function UserService($http, $state, $ionicPopup, $ionicLoading) {

  // ////////////////////////////////////////////////////////////////////////////
  // Private internal methods and variables
  // ////////////////////////////////////////////////////////////////////////////
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
        if (VALID_PHONE_REGEX.test(response)) {
          return Promise.resolve(response);
        }
        // Reprompt with a message if the number given is invalid
        return promptForPhone("Please enter a valid 8 digit mobile number");
      }
    });
  };

  // Prompts the user for a verification code
  // Reprompts the user if the number given isnt a valid 6 digit string
  // Returns a promise for the telephone number if successful
  // Should be basically the same as promptForPhone but with different regex and strings
  var promptForCode = function(message) {
    return $ionicPopup.prompt({
      title: 'Verification Code',
      subTitle: message,
      inputPlaceholder: 'e.g. 123456'
    })
    .then(function(response) {
      // Need to explicitly check for undefined to distinguish between empty string
      // and an actual cancel
      if (typeof response !== 'undefined') {
        if (VALID_VERIFICATION_CODE_REGEX.test(response)) {
          return Promise.resolve(response);
        }
        // Reprompt with a message if the number given is invalid
        return promptForCode("Please enter a valid 6 digit code");
      }
    });
  };

  // The combined prompt for phone number and subsequent prompt for verification code
  var promptLogIn = function() {
    // Start by prompting for the phone number
    return promptForPhone("Please enter your mobile number to receive a verification code")
    .then(function(telephone) {
      // Proceed if we are given a valid number, undefined means a user cancelled
      // Show show a loding screen while waiting for server reply
      // If replied successfully then prompt for the verification code
      if (typeof telephone !== "undefined") {
        $ionicLoading.show({template: requestingVerificationCodeTemplate});
        return sendTelephoneVerificationCode(telephone)
        .then(function() {
          $ionicLoading.hide();
          return promptForCode('Enter the 6 digit code sent to ' + telephone);
        }, function(error) {
          // If an error occurs make sure to hide the loading stuff before rethrowing it
          $ionicLoading.hide();
          return Promise.reject(error);
        })
        .then(function(verificationCode) {
          // Same drill for the verification code
          // Check to see if its really entered or a user cancel
          // Then send it to server
          if (typeof verificationCode !== "undefined") {
            $ionicLoading.show({template: sendingVerificationCodeTemplate});
            return verifyTelephone(telephone, verificationCode)
            .then(function() {
              $ionicLoading.hide();
              return Promise.resolve(verificationCode);
            }, function(error) {
              // If an error occurs make sure to hide the loading stuff before rethrowing it
              $ionicLoading.hide();
              return Promise.reject(error);
            });
          }
        });
      }
    })
    // If an error occurs at any point stop and alert the user
    .catch(function(error) {
      $ionicPopup.alert({
        title: "Error when trying to connect to server",
        subTitle: error
      });
    });
  };

  // Similar to prompt login
  // The combined prompt for phone number and subsequent prompt for verification code
  var promptUpdatePhone = function() {
    // Start by prompting for the phone number
    return promptForPhone("Please enter the new mobile number to receive a verification code")
    .then(function(telephone) {

      // Proceed if we are given a valid number, undefined means a user cancelled
      if (typeof telephone !== "undefined") {
        // Show the loading screen while requesting the code and hide it when done
        // Show show a loding screen while waiting for server reply
        $ionicLoading.show({template: requestingVerificationCodeTemplate});
        var updateTokenPromise = requestUpdateTelephone(telephone);
        updateTokenPromise.then(function(token) {
          $ionicLoading.hide();
        }, function(error) {
          $ionicLoading.hide();
        });
        // If replied successfully then prompt for the verification code
        var updateCodePromise = updateTokenPromise.then(function() {
          return promptForCode('Enter the 6 digit code sent to ' + telephone);
        });
        // Once we have the token and the code then submit it to the server
        return Promise.all([updateTokenPromise, updateCodePromise]).then(function(values) {
          var token = values[0];
          var code = values[1];
          if (typeof code !== "undefined") {
            // Same as when requesting the code, when submitting the code show a modal
            // hide it when done
            $ionicLoading.show({template: sendingVerificationCodeTemplate});
            return updateTelephone(token, code)
            .then(function() {
              $ionicLoading.hide();
              $ionicPopup.alert({
                title: "Your phone number has been successfully updated",
                subTitle: "It is now " + telephone
              });
            }, function(error) {
              $ionicLoading.hide();
              return Promise.reject(error);
            });
          }
        });
      }
    })
    // If an error occurs at any point stop and alert the user
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
