import querystring from 'querystring'

export default function UserService($http, $state) {
  var preLoginState;
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
    this.beeline({
      method: 'GET',
      url: '/user',
    })
    .then((response) => {
      this.user = response.data;
    })
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
        this.sessionToken = response.data.sessionToken;
        this.loadUserData();
        return true;
      });
    },

    /** calls the /user endpoint to check if user is logged in */
    getCurrentUser() {
      return this.user;
    },

    /** Ensures that the session token is valid too **/
    isLoggedInReal: function() {
      return this.beeline({
      url: '/user',
      method: 'GET'
      })
      .then(() => true, () => false);
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
