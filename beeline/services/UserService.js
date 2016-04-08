export default function UserService($http) {
        return {
            user: {},
            sessionToken: localStorage['sessionToken'] || null,
            userPromise: null,
            loginPromise: null,
            mobileNo: null,

            beeline(options) {
                options.url = 'http://staging.beeline.sg' + options.url;
                if (this.sessionToken) {
                    options.headers = options.headers || {}
                    options.headers.authorization = 'Bearer ' + this.sessionToken;
                }
                return $http(options);
            },

            sendTelephoneVerificationCode: function(no){
                var self = this;
                var url="http://staging.beeline.sg/users/sendTelephoneVerification";
                var data={
                    "telephone":no
                 };
                var config ={
                    headers: {
                        "Content-Type": 'application/json'
                    }
                };
                return $http.post(url,data,config);
            },

            verifyTelephone: function(code){
                var querystring = require('querystring');
                return this.beeline({
                    method: 'GET',
                    url: '/users/verifyTelephone?' + querystring.stringify({
                        telephone: '+65' + this.mobileNo,
                        code: code,
                    })
                })
                .then((response) => {
                    this.sessionToken = response.data.sessionToken;
                    return true;
                });
            },

            authenticate() {
                // FIXME: Navigate to the login page and back
                // if user is not logged in
                return Promise.resolve(this);
            }
        };
    }
