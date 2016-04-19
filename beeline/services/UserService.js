import querystring from 'querystring'

export default function UserService($http, $state, $ionicPopup) {
  var preLoginState;
  var userPromise = Promise.resolve(null);

  var instance = {
    user: null,
    sessionToken: window.localStorage['sessionToken'] || null,
    telephone: null,

    beeline(options) {
      options.url = 'http://staging.beeline.sg' + options.url;
      if (this.sessionToken) {
        options.headers = options.headers || {}
        options.headers.authorization = 'Bearer ' + this.sessionToken;
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
      delete window.localStorage['sessionToken'];
    },

    logIn(force) {
      preLoginState = $state.current;
      $state.go('login')
    },
    afterLogin() {
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
