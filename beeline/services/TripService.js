export default function TripService($http) {
  var trip;

  return {
    getTripData: function(id){
      return $http.get("http://staging.beeline.sg/trips/"+id, {
        headers: {
          "Authorization": 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciIsInVzZXJJZCI6MSwiaWF0IjoxNDU2Mzk2MTU4fQ.eCgMcdrhZAWfWcQ3hhcYts9oyQetZ4prGGf4t5xEAwU'
        }
      });
    },

    getRoutePath: function(id){
      return $http.get("http://staging.beeline.sg/routes/"+id, {
        headers: {}
      });
    },

    DriverPings: function(id) {
      return $http.get("http://staging.beeline.sg/trips/"+id+"/latest_info", {
          headers: {}
      });
    }
  };
}
