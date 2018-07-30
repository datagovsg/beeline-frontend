angular.module('beeline').factory('SuggestionService', [
  'RequestService',
  function SuggestionService (RequestService) {
    let suggestions

    return {
      createSuggestion: function (board, alight, time, daysOfWeek) {
        return RequestService.beeline({
          method: 'POST',
          url: '/suggestions',
          data: { board, alight, time, daysOfWeek },
        }).then(response => {
          return response.data
        })
      },

      getSuggestions: function () {
        return suggestions
      },

      fetchSuggestions: function () {
        return RequestService.beeline({
          method: 'GET',
          url: '/suggestions',
        }).then(response => {
          suggestions = response.data
          return response.data
        })
      },

      // driverPings: function (id) {
      //   assert(typeof id === 'number')
      //   return RequestService.tracking({
      //     method: 'GET',
      //     url: `/trips/${id}/pings?limit=20`,
      //     timeout: 10000,
      //   }).then(function (response) {
      //     for (let ping of response.data) {
      //       ping.time = new Date(ping.time)
      //     }
      //     return response.data
      //   })
      // },
    }
  },
])
