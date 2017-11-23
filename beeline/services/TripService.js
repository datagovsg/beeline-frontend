import assert from 'assert'

export default ['UserService',
  function TripService(UserService) {
    return {

      getTripData: function(id) {
        assert(typeof id === 'number')
        return UserService.beeline({
          method: 'GET',
          url: '/trips/' + id,
        }).then(function(response) {
          return response.data
        })
      },

      driverPings: function(id) {
        assert(typeof id === 'number')
        return UserService.beeline({
          method: 'GET',
          url: '/trips/' + id + '/latestInfo',
          timeout: 10000,
        }).then(function(response) {
          for (let ping of response.data.pings) {
            ping.time = new Date(ping.time)
          }
          return response.data
        })
      },
    }
  },
]
