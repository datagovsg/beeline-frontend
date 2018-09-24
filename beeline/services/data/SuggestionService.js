import querystring from 'querystring'

angular.module('beeline').factory('SuggestionService', [
  'RequestService',
  'UserService',
  'CrowdstartService',
  function SuggestionService (RequestService, UserService, CrowdstartService) {
    let suggestions
    let routes
    let createdSuggestion

    function convertDaysToBinary (days) {
      const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      let sum = 0
      for (let i = 0; i < week.length; i++) {
        sum += days[week[i]] * Math.pow(2, i)
      }
      return sum
    }

    UserService.userEvents.on('userChanged', () => {
      fetchSuggestions()
    })

    async function fetchSuggestions () {
      if (!UserService.getUser()) return
      let userSuggestions = await fetchUserSuggestions()

      // ----------------PARALLEL REQUESTS---------------- //
      const promises = userSuggestions.map(async (sug, index) => {
        const start = {
          lat: sug.board.coordinates[1],
          lng: sug.board.coordinates[0],
        }
        const end = {
          lat: sug.alight.coordinates[1],
          lng: sug.alight.coordinates[0],
        }
        const similar = await fetchSimilarSuggestions(start, end, sug.time)
        userSuggestions[index] = {
          ...sug,
          similar,
          boardDescription: sug.boardDescription,
          alightDescription: sug.alightDescription,
        }
      })

      await Promise.all(promises)
      suggestions = userSuggestions
      return suggestions
    }

    function fetchUserSuggestions () {
      return RequestService.beeline({
        method: 'GET',
        url: '/suggestions',
      }).then(response => {
        return response.data
      })
    }

    function fetchSimilarSuggestions (start, end, time) {
      let queryString = querystring.stringify({
        startLat: start.lat,
        startLng: start.lng,
        endLat: end.lat,
        endLng: end.lng,
        time,
      })
      return RequestService.beeline({
        method: 'GET',
        url: '/suggestions/web/similar?' + queryString,
      }).then(response => {
        return response.data.length
      })
    }

    function requestCreateNewSuggestion (
      board,
      boardDescription,
      alight,
      alightDescription,
      time,
      daysOfWeek
    ) {
      return RequestService.beeline({
        method: 'POST',
        url: '/suggestions',
        data: { board, boardDescription, alight, alightDescription, time, daysOfWeek },
      }).then(response => {
        triggerRouteGeneration(response.data.id, response.data.daysOfWeek)
        return response.data
      })
    }

    function triggerRouteGeneration (suggestionId, days) {
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
    }

    function convertToCrowdstart (suggestionId, suggestedRouteId) {
      return RequestService.beeline({
        method: 'POST',
        url: `/suggestions/${suggestionId}/suggested_routes/${suggestedRouteId}/convert_to_crowdstart`,
      }).then(response => {
        return response.data
      })
    }

    return {
      createSuggestion: async function (board, boardDescription, alight, alightDescription, time, daysOfWeek) {
        let suggestion = await requestCreateNewSuggestion(
          board,
          boardDescription,
          alight,
          alightDescription,
          time,
          daysOfWeek
        )
        const start = {
          lat: suggestion.board.coordinates[1],
          lng: suggestion.board.coordinates[0],
        }
        const end = {
          lat: suggestion.alight.coordinates[1],
          lng: suggestion.alight.coordinates[0],
        }
        const similar = await fetchSimilarSuggestions(start, end, suggestion.time)
        createdSuggestion = {
          ...suggestion,
          similar,
          boardDescription: suggestion.boardDescription,
          alightDescription: suggestion.alightDescription,
        }
        return createdSuggestion
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

      fetchSuggestions,

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
        }).then(async response => {
          routes = []

          const promises = response.data
            .filter(r => r.route) // omit any false routes
            .map(async r => {
              let route
              if (r.routeId) {
                route = await CrowdstartService.getCrowdstartById(r.routeId)
              } else {
                let crowdstart = await convertToCrowdstart(suggestionId, r.id)
                route = crowdstart.route
              }
              routes.push(route)
            })
          await Promise.all(promises)

          return {
            done: response.data.length > 0,
            routes,
          }
        })
      },
    }
  },
])
