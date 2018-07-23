import querystring from 'querystring'

angular.module('common').factory('OneMapPlaceService', [
  '$http',
  function OneMapPlaceService ($http) {
    const makeQuery = async function makeQuery (queryText) {
      let url = 'https://developers.onemap.sg/commonapi/search?'
      let queryString = querystring.stringify({
        returnGeom: 'Y',
        getAddrDetails: 'Y',
        searchVal: queryText,
      })
      let { data: result } = await $http({
        method: 'GET',
        url: url + queryString,
      })
      return result
    }

    return {
      async handleQuery (queryText) {
        let result = await makeQuery(queryText)
        if (!result || (result && result.found === 0)) {
          return null
        } else {
          let first = result.results[0]
          return {
            queryText,
            geometry: {
              location: {
                lat: () => first.LATITUDE,
                lng: () => first.LONGITUDE,
              },
            },
          }
        }
      },

      async getAllResults (queryText) {
        let result = await makeQuery(queryText)
        if (!result || (result && result.found === 0)) {
          return null
        } else {
          result.results = result.results.map(location => {
            for (var prop in location) {
              // Transform text to lower case. Use CSS to style appropriately
              location[prop] = location[prop].toLowerCase()
            }
            return location
          })
          return result
        }
      },
    }
  },
])
