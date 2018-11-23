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

    const transformPropertiesToLowercase = function transformPropertiesToLowercase (location) {
      for (var prop in location) {
        // Transform text to lower case. Use CSS to style appropriately
        location[prop] = location[prop].toLowerCase()
      }
      return location
    }

    const transfromRevGeocodeResults = function transfromRevGeocodeResults (data) {
      if (!data) return data

      const schema = {
        BLOCK: 'BLK_NO',
        BUILDINGNAME: 'BUILDING',
        ROAD: 'ROAD_NAME',
        POSTALCODE: 'POSTAL',
        XCOORD: 'X',
        YCOORD: 'Y',
        LATITUDE: 'LATITUDE',
        LONGITUDE: 'LONGITUDE',
        LONGTITUDE: 'LONGTITUDE',
      }

      let result = {}
      Object.entries(data).map(d => {
        let key = schema[d[0]]
        result[key] = d[1]
      })

      return transformPropertiesToLowercase(result)
    }

    const getAllResults = async function getAllResults (queryText) {
      let result = await makeQuery(queryText)
      if (!result || (result && result.found === 0)) {
        return null
      } else {
        result.results = result.results.map(transformPropertiesToLowercase)
        return result
      }
    }

    let lastToken = {
      exp: 0,
      token: null,
    }

    const getToken = async function getToken () {
      var now = new Date().getTime()

      /* 10 minutes to expiry */
      if (lastToken.exp * 1e3 - now > 10 * 60e3) {
        return lastToken.token
      } else {
        var url = 'https://developers.onemap.sg/publicapi/publicsessionid'

        const token = await $http({ url, method: 'GET' })
          .then(response => {
            lastToken.exp = response.data.expiry_timestamp
            lastToken.token = response.data.access_token
            return response.data.access_token
          })

        return token
      }
    }

    return {
      async reverseGeocode (lat, lng) {
        let token = await getToken()
        let url = 'https://developers.onemap.sg/publicapi/revgeocode?'
        let queryString = querystring.stringify({
          token,
          location: lat + ',' + lng,
        })
        let { data: result } = await $http({
          method: 'GET',
          url: url + queryString,
        })

        return transfromRevGeocodeResults(result.GeocodeInfo[0])
      },

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

      getAllResults,

      async getTopResult (queryText) {
        let results = await getAllResults(queryText)
        if (results) {
          let location = results.results[0]
          location.ADDRESS = queryText
          return location
        }
        return null
      },
    }
  },
])
