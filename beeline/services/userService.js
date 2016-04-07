import querystring from 'querystring'

export function UserService($http, $state) {
  var preLoginState;

  var instance = {
    user: {},
    sessionToken: localStorage['sessionToken'] || null,
    userPromise: null,
    loginPromise: null,
    mobileNo: null,

    /**
      Make a request to the beeline server. This handles the session token
      if one exists.
      Options are equivalent to the options passed to $http, except
      `url` may be a relative path (i.e. omit the hostname and protocol)
    **/
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
          telephone: '+65' + this.mobileNo,
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
    isLoggedIn: function() {
      if (!this.sessionToken) {
        return false;
      }
      return true;
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
      if (!this.isLoggedIn()) {
        preLoginState = $state.current;
        $state.go('login')
      }
    },
    afterLogin() {
      $state.go(preLoginState || 'tab.settings');
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
