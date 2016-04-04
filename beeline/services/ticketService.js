import querystring from 'querystring'

export function TickerService($http,$filter,userService) {
        var now = new Date();
        var today0000 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0).getTime();
        var today2400 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 24, 0).getTime();
        var tickets = [];
        var todaydata = [];
        var soondata = [];
        var todayDate = [];
        var selectedticket = null;

        return {
            getTickets: function(){
                var bearer = userService.sessionToken;
                if (!bearer){
                    return Promise.resolve([]);
                }
                return $http.get("http://staging.beeline.sg/tickets", {
                        headers: {
                        "Authorization": 'Bearer '+bearer
                        //"Authorization": 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciIsInVzZXJJZCI6MSwiaWF0IjoxNDU2Mzk2MTU4fQ.eCgMcdrhZAWfWcQ3hhcYts9oyQetZ4prGGf4t5xEAwU'
                        }
                    }).then((response) => {
                        tickets = response.data;
                        console.log("get tickets")
                        console.log(tickets);
                        return tickets;
                    });

            },
            getTicketById: function(id){
                for(var i=0;i<tickets.length;i++){
                    if(tickets[i].id == id){
                        console.log("found ticket 1");
                        return tickets[i];
                    }
                }
                return null;
            },

            splitTickets: function() {

                todaydata = tickets.filter(ts=> ts.boardStop!== null && new Date(ts.boardStop.time).getTime() > today0000 && new Date(ts.boardStop.time).getTime() < today2400);
                soondata = tickets.filter(ts=> ts.boardStop!== null && new Date(ts.boardStop.time).getTime() >= today2400);

            },
            todayTickets: function() {
                return todaydata;
            },

            soonTickets: function() {
                return soondata;
            },

            get: function(ticketId) {
              for (var i = 0; i < todaydata.length; i++) {
                if (todaydata[i].id === ticketId) {
                  return todaydata[i];
                }
              }
              for (var i = 0; i < soondata.length; i++) {
                if (soondata[i].id === ticketId) {
                  return soondata[i];
                }
              }
              return null;
            },

            setSelectedTicket: function(ticketId) {
              console.log("setselectedticket");
              console.log(ticketId);
             for (var i = 0; i < tickets.length; i++) {
                if (tickets[i].id === ticketId) {
                  selectedticket = tickets[i];

                }
              }
              console.log("-------------------");
              console.log("setselectedticket");
              console.log(selectedticket);
            },
            getSelectedTicket: function() {
                //need to handle if null
                return selectedticket;
            }
        };
    }

export function UserService($http) {
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

export function TripService($http) {
        var trip;
        return {
            Trip: function(id){
                return $http.get("http://staging.beeline.sg/trips/"+id, {
                    headers: {
                    "Authorization": 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciIsInVzZXJJZCI6MSwiaWF0IjoxNDU2Mzk2MTU4fQ.eCgMcdrhZAWfWcQ3hhcYts9oyQetZ4prGGf4t5xEAwU'
                    }
            }).then(function(response){
                    trip = response.data;
                });
            },

            gettrip: function(){
                return trip;
            },

        };
    }

export function CompanyService($http) {
        var company;
        return {
            Company: function(id){
                return $http.get("http://staging.beeline.sg/companies/"+id, {
                    headers: {
                    "Authorization": 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciIsInVzZXJJZCI6MSwiaWF0IjoxNDU2Mzk2MTU4fQ.eCgMcdrhZAWfWcQ3hhcYts9oyQetZ4prGGf4t5xEAwU'
                    }
            }).then(function(response){
                    company = response.data;
                });
            },

            getcompany: function(){
                return company;
            },

        };
    }