import querystring from 'querystring'

angular.module('common').factory('OneMapPlaceService', [
  '$http',
  function OneMapPlaceService ($http) {
    return {
      async handleQuery (queryText) {
        let url = 'https://developers.onemap.sg/commonapi/search?'
        let queryString = querystring.stringify({
          returnGeom: 'Y',
          getAddrDetails: 'N',
          searchVal: queryText,
        })
        let { data: result } = await $http({
          method: 'GET',
          url: url + queryString,
        })
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
    }
  },
])
