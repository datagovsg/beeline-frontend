export default function TripService($http) {
        var trip;
        var pings;
        
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

			DriverPings: function(id) {
				return $http.get("http://staging.beeline.sg/trips/"+id+"/latest_info", {
                    headers: {}
				}).then(function(response){
                    pings = response.data;
                });
			},

			getDriverPings: function() {
				return pings;
			}
        };
    }
