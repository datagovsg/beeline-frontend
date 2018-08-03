import querystring from 'querystring'

angular.module('beeline').factory('SuggestionService', [
  'RequestService',
  'UserService',
  'OneMapPlaceService',
  function SuggestionService (RequestService, UserService, OneMapPlaceService) {
    let suggestions
    let createdSuggestion

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
          lng: suggestion.alight.coordinates[0]
        }
        const end = {
          lat: suggestion.board.coordinates[1],
          lng: suggestion.board.coordinates[0]
        }
        const boardLocation = await OneMapPlaceService.reverseGeocode(start.lat, start.lng)
        const alightLocation = await OneMapPlaceService.reverseGeocode(end.lat, end.lng)
        const similar = await this.fetchSimilarSuggestions(start, end)
        createdSuggestion = {
          ...suggestion,
          similar,
          boardLocation,
          alightLocation
        }
        return createdSuggestion
      },

      requestCreateNewSuggestion: function (board, alight, time, daysOfWeek) {
        return RequestService.beeline({
          method: 'POST',
          url: '/suggestions',
          data: { board, alight, time, daysOfWeek },
        }).then(response => {
          return response.data
        })
      },

      getSuggestion: function (suggestionId) {
        let details = createdSuggestion 
                        ? createdSuggestion 
                        : suggestions.filter(sug => sug.id === suggestionId)[0]
        createdSuggestion = null
        return Promise.resolve({
          details
        })
      },

      getSuggestions: function () {
        return suggestions
      },

      fetchSuggestions: async function () {
        let userSuggestions = await this.fetchUserSuggestions()

        // ----------------PARALLEL REQUESTS---------------- //
        const promises = userSuggestions.map(async (sug, index) => {
          const start = {
            lat: sug.alight.coordinates[1],
            lng: sug.alight.coordinates[0]
          }
          const end = {
            lat: sug.board.coordinates[1],
            lng: sug.board.coordinates[0]
          }
          const boardLocation = await OneMapPlaceService.reverseGeocode(start.lat, start.lng)
          const alightLocation = await OneMapPlaceService.reverseGeocode(end.lat, end.lng)
          const similar = await this.fetchSimilarSuggestions(start, end)
          userSuggestions[index] = {
            ...sug,
            similar,
            boardLocation,
            alightLocation
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
          return response.data.filter(sug => sug.userId === user.id)
        })
      },
      
      fetchSimilarSuggestions: function (start, end) {
        let queryString = querystring.stringify({
          startLat: start.lat,
          startLng: start.lng,
          endLat: end.lat,
          endLng: end.lng
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
          url: `/suggestions/${suggestionId}`
        }).then(response => {
          return response
        })
      }
    }
  },
])
