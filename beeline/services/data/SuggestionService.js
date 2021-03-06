import querystring from 'querystring'

angular.module('beeline').factory('SuggestionService', [
  'RequestService',
  'UserService',
  'CrowdstartService',
  function SuggestionService (RequestService, UserService, CrowdstartService) {
    let suggestions
    let createdSuggestion
    let suggestedRoutes = {}

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
        const similar = await fetchSimilarSuggestions(start, end, sug.time, sug.daysOfWeek)
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

    function fetchSimilarSuggestions (start, end, time, daysOfWeek) {
      let queryString = querystring.stringify({
        startLat: start.lat,
        startLng: start.lng,
        endLat: end.lat,
        endLng: end.lng,
        time,
        startDistance: 350,
        endDistance: 350,
        maxTimeDifference: 1800e3, // half an hour
        includeAnonymous: false,
        daysMask: convertDaysToBinary(daysOfWeek),
        createdSince: Date.now() - 2 * 365 * 24 * 60 * 60 * 1000, // 2 years back
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
      daysOfWeek,
      referrer
    ) {
      return RequestService.beeline({
        method: 'POST',
        url: '/suggestions',
        data: { board, boardDescription, alight, alightDescription, time, daysOfWeek, referrer },
      }).then(response => {
        triggerRouteGeneration(response.data.id)
        return response.data
      })
    }

    function previewRoute (suggestionId, suggestedRouteId) {
      return RequestService.beeline({
        method: 'GET',
        url: `/suggestions/${suggestionId}/suggested_routes/${suggestedRouteId}/preview_route`,
      }).then(response => {
        return response.data
      })
    }

    function triggerRouteGeneration (suggestionId) {
      return RequestService.routing({
        method: 'POST',
        url: `/suggestions/${suggestionId}/trigger_route_generation`,
        data: {
          maxDetourMinutes: 0.5,
          startClusterRadius: 3000,
          startWalkingDistance: 400,
          endClusterRadius: 3000,
          endWalkingDistance: 400,
          timeAllowance: 1800 * 1000, // Half an hour
          matchDaysOfWeek: true,
          imputedDwellTime: 10000,
          includeAnonymous: false,
          createdSince: Date.now() - 2 * 365 * 24 * 60 * 60 * 1000, // 2 years back,
          suboptimalStopChoiceAllowance: 10000,
        },
      }).then(response => {
        return response.data
      })
    }

    async function triggerRouteGenAgain (suggestedRoute) {
      let now = new Date()
      let createdAt = new Date(suggestedRoute.createdAt)

      if (
        // If successful suggestion is more than one month old
        // or failed suggestions is more than a day old
        // trigger route generation again to refresh the suggested route
        (suggestedRoute.route.status === 'Success' && now - createdAt > 30 * 24 * 3600e3) ||
        (suggestedRoute.route.status === 'Failure' && now - createdAt > 24 * 3600e3)
      ) {
        let suggestionId = suggestedRoute.seedSuggestionId
        await triggerRouteGeneration(suggestionId)

        if (!suggestedRoutes[suggestionId]) {
          suggestedRoutes[suggestionId] = {}
        }

        suggestedRoutes[suggestionId].reTriggerRouteGeneration = true
        suggestedRoutes[suggestionId].suggRouteLastCreated = new Date(suggestedRoute.createdAt)
      }
    }

    return {
      createSuggestion: async function (board, boardDescription, alight, alightDescription, time, daysOfWeek) {
        let referrer = 'Beeline'
        let suggestion = await requestCreateNewSuggestion(
          board,
          boardDescription,
          alight,
          alightDescription,
          time,
          daysOfWeek,
          referrer
        )
        const start = {
          lat: suggestion.board.coordinates[1],
          lng: suggestion.board.coordinates[0],
        }
        const end = {
          lat: suggestion.alight.coordinates[1],
          lng: suggestion.alight.coordinates[0],
        }
        const similar = await fetchSimilarSuggestions(start, end, suggestion.time, suggestion.daysOfWeek)
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
        return details
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

      fetchSuggestedRoute: function (suggestionId) {
        return RequestService.routing({
          method: 'GET',
          url: `/suggestions/${suggestionId}/suggested_routes`,
        }).then(async response => {
          if (response.data.length === 0) {
            return null
          }
          // Get latest suggested route
          const r = response.data[0]

          // check if needed to re-trigger route generation
          if (!suggestedRoutes[suggestionId] || !suggestedRoutes[suggestionId].reTriggerRouteGeneration) {
            await triggerRouteGenAgain(r)
          }

          // if route generation has been re-triggered and
          // a new suggested route has not returned
          if (suggestedRoutes[suggestionId] && suggestedRoutes[suggestionId].reTriggerRouteGeneration && new Date(r.createdAt) <= suggestedRoutes[suggestionId].suggRouteLastCreated) {
            return null
          }

          let route
          if (r.routeId) {
            route = await CrowdstartService.getCrowdstartById(r.routeId)
          }
          if (r.route.status === 'Success' && !r.routeId) {
            route = await previewRoute(suggestionId, r.id)
          }

          let suggestedRoute = {
            ...route,
            info: {
              status: r.route.status,
              reason: r.route.reason,
            },
            suggestedRouteId: r.id,
            suggestionId,
            // store the status of route generation
            reTriggerRouteGeneration: false,
            suggRouteLastCreated: null,
          }
          suggestedRoutes[suggestionId] = suggestedRoute

          return suggestedRoute
        })
      },

      triggerRouteGeneration,

      convertToCrowdstart: function (suggestionId, suggestedRouteId) {
        return RequestService.beeline({
          method: 'POST',
          url: `/suggestions/${suggestionId}/suggested_routes/${suggestedRouteId}/convert_to_crowdstart`,
        }).then(response => {
          return response.data
        })
      },
    }
  },
])
