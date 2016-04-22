export default function TripService(UserService) {
  return {
    
    getTripData: function(id){
      return UserService.beeline({
        method: 'GET',
        url: `/trips/${id}`,
      }).then((response) => {
        return response.data;
      });
    },

    getRoutePath: function(id){
      return UserService.beeline({
        method: 'GET',
        url: `/routes/${id}`,
      }).then((response) => {
        return response.data;
      });
    },

    DriverPings: function(id) {
      return UserService.beeline({
        method: 'GET',
        url: `/trips/${id}/latest_info`,
      }).then((response) => {
        return response.data;
      });
    }

  };
}
