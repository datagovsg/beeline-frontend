export default function TripService(UserService) {
    return {
      getTripData: function(id){
        return UserService.beeline({
          method: 'GET',
          url: `/trips/${id}`,
        })
      },

      getRoutePath: function(id){
        return UserService.beeline({
          method: 'GET',
          url: `/routes/${id}`,
        })
      },

      DriverPings: function(id) {
        return UserService.beeline({
          method: 'GET',
          url: `/trips/${id}/latest_info`,
        })
      },
    };
}
