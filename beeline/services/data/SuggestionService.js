import querystring from 'querystring'

angular.module('beeline').factory('SuggestionService', [
  'RequestService',
  'UserService',
  'OneMapPlaceService',
  function SuggestionService (RequestService, UserService, OneMapPlaceService) {
    let suggestions
    let createdSuggestion

    function convertDaysToBinary (days) {
      const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      let sum = 0
      for (let i = 0; i < week.length; i++) {
        sum += days[week[i]] * Math.pow(2, i)
      }
      return sum
    }

    return {
      createSuggestion: async function (alight, board, time, daysOfWeek) {
        let suggestion = await this.requestCreateNewSuggestion(
          board,
          alight,
          time,
          daysOfWeek
        )
        const start = {
          lat: suggestion.alight.coordinates[1],
          lng: suggestion.alight.coordinates[0],
        }
        const end = {
          lat: suggestion.board.coordinates[1],
          lng: suggestion.board.coordinates[0],
        }
        const boardLocation = await OneMapPlaceService.reverseGeocode(start.lat, start.lng)
        const alightLocation = await OneMapPlaceService.reverseGeocode(end.lat, end.lng)
        const similar = await this.fetchSimilarSuggestions(start, end)
        createdSuggestion = {
          ...suggestion,
          similar,
          boardLocation,
          alightLocation,
        }
        return createdSuggestion
      },

      requestCreateNewSuggestion: function (board, alight, time, daysOfWeek) {
        return RequestService.beeline({
          method: 'POST',
          url: '/suggestions',
          data: { board, alight, time, daysOfWeek },
        }).then(response => {
          this.triggerRouteGeneration(response.data.id, response.data.daysOfWeek)
          return response.data
        })
      },

      getSuggestion: function (suggestionId) {
        let details = createdSuggestion || suggestions.filter(sug => sug.id === suggestionId)[0]
        createdSuggestion = null
        return Promise.resolve({
          details,
        })
      },

      getSuggestions: function () {
        return suggestions
      },

      fetchSuggestions: async function () {
        if (!UserService.getUser()) return
        let userSuggestions = await this.fetchUserSuggestions()

        // ----------------PARALLEL REQUESTS---------------- //
        const promises = userSuggestions.map(async (sug, index) => {
          const start = {
            lat: sug.alight.coordinates[1],
            lng: sug.alight.coordinates[0],
          }
          const end = {
            lat: sug.board.coordinates[1],
            lng: sug.board.coordinates[0],
          }
          const boardLocation = await OneMapPlaceService.reverseGeocode(start.lat, start.lng)
          const alightLocation = await OneMapPlaceService.reverseGeocode(end.lat, end.lng)
          const similar = await this.fetchSimilarSuggestions(start, end)
          userSuggestions[index] = {
            ...sug,
            similar,
            boardLocation,
            alightLocation,
          }
        })

        await Promise.all(promises)
        suggestions = userSuggestions
        return suggestions
      },

      fetchUserSuggestions: function () {
        let user = UserService.getUser()
        return RequestService.beeline({
          method: 'GET',
          url: '/suggestions',
        }).then(response => {
          return response.data
        })
      },

      fetchSimilarSuggestions: function (start, end) {
        let queryString = querystring.stringify({
          startLat: start.lat,
          startLng: start.lng,
          endLat: end.lat,
          endLng: end.lng,
        })
        return RequestService.beeline({
          method: 'GET',
          url: '/suggestions/web/similar?' + queryString,
        }).then(response => {
          return response.data.length
        })
      },

      deleteSuggestion: function (suggestionId) {
        return RequestService.beeline({
          method: 'DELETE',
          url: `/suggestions/${suggestionId}`,
        }).then(response => {
          return response
        })
      },

      fetchSuggestedRoutes: function (suggestionId) {
        return RequestService.beeline({
          method: 'GET',
          url: `/suggestions/${suggestionId}/suggested_routes`,
        }).then(response => {
          return response.data
        })
      },

      triggerRouteGeneration: function (suggestionId, days) {
        const daysOfWeek = convertDaysToBinary(days)
        return RequestService.beeline({
          method: 'POST',
          url: `/suggestions/${suggestionId}/suggested_routes/trigger_route_generation`,
          data: {
            maxDetourMinutes: 10,
            startClusterRadius: 4000,
            startWalkingDistance: 400,
            endClusterRadius: 4000,
            endWalkingDistance: 400,
            timeAllowance: 1800 * 1000, // Half an hour
            daysOfWeek, // 0b0011111 - Mon-Fri
            dataSource: 'suggestions',
          },
        }).then(response => {
          return response.data
        })
      },

      convertToCrowdstart: function (suggestionId, routeId) {
        return RequestService.beeline({
          method: 'POST',
          url: `/suggestions/${suggestionId}/suggested_routes/${routeId}/convert_to_crowdstart`,
        }).then(response => {
          return response.data
        })
      },
    }
  },
])
