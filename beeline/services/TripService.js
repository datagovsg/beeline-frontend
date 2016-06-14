import assert from 'assert';

export default function TripService(UserService) {
  return {

    getTripData: function(id) {
      assert(typeof id === 'number');
      return UserService.beeline({
        method: 'GET',
        url: '/trips/' + id,
      }).then(function(response) {
        return response.data;
      });
    },

    DriverPings: function(id) {
      assert(typeof id === 'number');
      return UserService.beeline({
        method: 'GET',
        url: '/trips/' + id + '/latestInfo',
      }).then(function(response) {
        return response.data;
      });
    }

  };
}
