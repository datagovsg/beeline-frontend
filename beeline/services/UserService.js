import querystring from 'querystring'
import uuid from 'uuid';

export default function UserService($http, $state, $ionicPopup) {
  var preLoginState;
  var userPromise = Promise.resolve(null);

  var instance = {
    user: null,
    sessionToken: window.localStorage['sessionToken'] || null,
    telephone: null,

    beeline(options) {
      options.url = 'http://staging.beeline.sg' + options.url;
      options.headers = options.headers || {}
      if (this.sessionToken) {
        options.headers.authorization = 'Bearer ' + this.sessionToken;
      }

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

    loadUserData() {
      if (this.sessionToken) {
        userPromise = this.beeline({
          method: 'GET',
          url: '/user',
        })
        .then((response) => {
          return this.user = response.data;
        })
      }
      else {
        userPromise = Promise.resolve(null);
      }
    },

    sendTelephoneVerificationCode: function(no){
      return this.beeline({
        method: 'POST',
        url: '/users/sendTelephoneVerification',
        data: {
          "telephone":no
        },
        headers: {
          "Content-Type": 'application/json'
        }
      });
    },

    verifyTelephone: function(code){
      return this.beeline({
        method: 'GET',
        url: '/users/verifyTelephone?' + querystring.stringify({
          telephone: '+65' + this.telephone,
          code: code,
        })
      })
      .then((response) => {
				if (response.statusText = 'OK')
				{
          this.sessionToken = response.data.sessionToken;
          this.user = response.data.user;
          localStorage.setItem('sessionToken', response.data.sessionToken);

          var ud = response.data.user;
          var userobj = {
            name: ud.name,
            email: ud.email,
            telephone: ud.telephone
          };

          localStorage.setItem('beelineUser', JSON.stringify(userobj));

          return true;
				}
				else
					return false;
      }, (error) => {
				$ionicPopup.alert('An error occurred while trying to log in');
				return false;
      });
    },

    getLocalJsonUserData() {
      return JSON.parse(localStorage['beelineUser']);
    },

    /** calls the /user endpoint to check if user is logged in */
    getCurrentUser() {
      return userPromise;
    },

    /** Ensures that the session token is valid too **/
    isLoggedInReal: function() {
      return this.beeline({
      url: '/user',
      method: 'GET'
      })
      .then(() => true, () => false);
    },

    isLoggedIn: function() {
      return !!this.sessionToken
    },

    logOut: function() {
      this.sessionToken = null;
      this.userPromise = Promise.resolve(null);
      delete window.localStorage['sessionToken'];
      instance.loadUserData();
    },

    /** Go to the login page
      * As opposed to a standard ui-sref='login', this
      * method saves the page. When login is complete it will return there.
    */
    logIn(force) {
      preLoginState = $state.current;
      $state.go('login')
    },

    /** Return to the page that activated the login */
    afterLogin() {
      instance.loadUserData();
      $state.go(preLoginState || 'tabs.settings');
      preLoginState = undefined;
    },

    cancelLogin() {
      $state.go(preLoginState);
      preLoginState = undefined;
    },
  };

  instance.loadUserData();
  return instance;
}
