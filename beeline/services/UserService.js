import querystring from 'querystring';

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
                return this.beeline({
                    method: 'GET',
                    url: '/users/verifyTelephone?' + querystring.stringify({
                        telephone: '+65' + this.mobileNo,
                        code: code,
                    })
                })
                .then((response) => {
					if (response.statusText = 'OK')
					{
						this.sessionToken = response.data.sessionToken;
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
					alert('An error occurred while trying to log in');
					
					return false;
				});
            },

            authenticate() {
                // FIXME: Navigate to the login page and back
                // if user is not logged in
                return Promise.resolve(this);
            }
        };
    }
