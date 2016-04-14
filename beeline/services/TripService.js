export default function TripService(UserService) {
    var trip;
    var routepath;
    var pings;

    return {
      Trip: function(id){
        return UserService.beeline({
          method: 'GET',
          url: `/trips/${id}`,
        }).then(function(response){
          trip = response.data;
        });
      },

      gettrip: function(){
        return trip;
      },

      RoutePath: function(id){
        return UserService.beeline({
          method: 'GET',
          url: `/routes/${id}`,
        }).then(function(response){
          routepath = response.data;
        });
      },

      getRoutePath: function() {
        return routepath;
      },

      DriverPings: function(id) {
        return UserService.beeline({
          method: 'GET',
          url: `/trips/${id}/latest_info`,
        })
      },

      getDriverPings: function() {
        return pings;
      }
    };
  }
