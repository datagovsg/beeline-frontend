import assert from 'assert'

angular.module('beeline').factory('TripService', [
  'RequestService',
  function TripService (RequestService) {
    return {
      getTripData: function (id, includeVehicle) {
        assert(typeof id === 'number')
        return RequestService.beeline({
          method: 'GET',
          url: '/trips/' + id,
          params: {
            includeVehicle,
          },
        }).then(function (response) {
          return response.data
        })
      },

      driverPings: function (id) {
        assert(typeof id === 'number')
        return RequestService.tracking({
          method: 'GET',
          url: `/trips/${id}/pings?limit=20`,
          timeout: 10000,
        }).then(function (response) {
          for (let ping of response.data) {
            ping.time = new Date(ping.time)
          }
          return response.data
        })
      },
    }
  },
])
