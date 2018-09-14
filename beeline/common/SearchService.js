import _ from 'lodash'

angular.module('common').factory('SearchService', [
  'RequestService',
  function SearchService (RequestService) {
    // Helper to calculate distance in meters between a pair of coordinates
    // faster but less accurate
    const latlngDistance = function latlngDistance (ll1, ll2) {
      let rr1 = [ll1[0] / 180 * Math.PI, ll1[1] / 180 * Math.PI]
      let rr2 = [ll2[0] / 180 * Math.PI, ll2[1] / 180 * Math.PI]

      let dx = (rr1[1] - rr2[1]) * Math.cos(0.5 * (rr1[0] + rr2[0]))
      let dy = rr1[0] - rr2[0]

      let dist = Math.sqrt(dx * dx + dy * dy) * 6378137
      return dist
    }

    const stopDistance = function stopDistance (tripStop, lnglat) {
      let stop = _.get(tripStop, 'stop', tripStop)
      let distance = latlngDistance(
        [stop.coordinates.coordinates[1], stop.coordinates.coordinates[0]],
        [lnglat[1], lnglat[0]]
      )
      return distance
    }

    const routeSimilarity = function routeSimilarity (route, stops) {
      let tripStops = getTripStopsFrom(route)
      let maxDistance = 2000
      let stopsNearRoute = stops.filter(({ lnglat }) =>
        _.some(
          tripStops,
          tripStop => stopDistance(tripStop, lnglat) < maxDistance
        )
      )
      return stopsNearRoute
        .map(stop => {
          stop.distance = Math.min(
            ...tripStops.map(tripStop => stopDistance(tripStop, stop.lnglat))
          )
          return stop
        })
        .map(
          ({ recency, distance }) =>
            recency * (maxDistance - distance) / maxDistance
        )
        .reduce((a, b) => a + b, 0)
    }

    const scoreRoute = function scoreRoute (stops) {
      return route => {
        route.score = routeSimilarity(route, stops)
        return route
      }
    }

    const getTripStopsFrom = function getTripStopsFrom (route) {
      if (route.trips) {
        // For normal and crowdstart routes
        return _.get(route, 'trips[0].tripStops', [])
      } else if (route.stops) {
        // For lite routes
        return route.stops
      }
    }

    return {
      filterRoutesByText: function (routes, string) {
        return routes.filter(route => this.routeContainsString(route, string))
      },

      filterRoutes: function (routes, regionId, string) {
        return this.filterRoutesByText(routes, string)
      },

      filterRoutesByPlace: function (routes, place) {
        let lnglat = [place.geometry.location.lng(), place.geometry.location.lat()]
        const maxDistance = 1000 // Arbitrary constant for closeness

        // Check the trips stops of a route to see if any come close
        let filteredRoutes = routes.filter(route => {
          return _.some(getTripStopsFrom(route), tripStop => {
            let distance = stopDistance(tripStop, lnglat)
            return distance < maxDistance
          })
        })

        return filteredRoutes
      },

      filterRoutesByLngLat: function (routes, lnglat, maxDistance) {
        // Check the trips stops of a route to see if any come close
        let filteredRoutes = routes.filter(route => {
          let tripStops = getTripStopsFrom(route)
          return _.some(tripStops, tripStop => {
            let distance = stopDistance(tripStop, lnglat)
            return distance < maxDistance
          })
        })

        return filteredRoutes
      },

      filterRoutesByLngLatAndType: function (routes, lnglat, type, maxDistance) {
        // Check the trips stops of a route to see if any come close
        let filteredRoutes = routes.filter(route => {
          let tripStops = getTripStopsFrom(route)
          return _.some(tripStops, tripStop => {
            let distance = stopDistance(tripStop, lnglat)
            return (distance < maxDistance && ((type === 'alight' && tripStop.canAlight) || (type === 'board' && tripStop.canBoard)))
          })
        })

        return filteredRoutes
      },

      filterRoutesByPlaceAndText: function (routes, place, text) {
        let placeResults = this.filterRoutesByPlace(routes, place)
        let textResults = this.filterRoutesByText(routes, text)
        return _.unionBy(placeResults, textResults, 'id')
      },

      // Input: a Route and a string
      // Output: True if route metatdata contains the string
      routeContainsString: function (route, string) {
        if (!string) return true

        const containsIgnoreCase = function containsIgnoreCase (s, t) {
          if (typeof s === 'string') {
            // If the search phrase (t) is more than one word, just find t in s
            // Otherwise, split s and see if any words in s start with t
            if (t.split(' ').length > 1) {
              return s.toUpperCase().includes(t.toUpperCase())
            } else {
              // Split on non-alphanumeric chars
              let words = s.toUpperCase().split(/[^A-Za-z0-9]/)
              return words.some(word => word.startsWith(t.toUpperCase()))
            }
          } else {
            return false
          }
        }
        return (
          containsIgnoreCase(route.name, string) ||
          containsIgnoreCase(route.notes && route.notes.description, string) ||
          containsIgnoreCase(route.schedule, string) ||
          containsIgnoreCase(route.label, string) ||
          (route.trips &&
            route.trips[0] &&
            route.trips[0].tripStops.some(
              ts =>
                containsIgnoreCase(ts.stop.description, string) ||
                containsIgnoreCase(ts.stop.road, string)
            )) ||
          (route.stops &&
            route.stops.some(
              s =>
                containsIgnoreCase(s.description, string) ||
                containsIgnoreCase(s.road, string)
            ))
        )
      },

      sortRoutes: async function (recentRoutes, routes) {
        // Simple heuristic to sort routesYouMayLike based on recentRoutes
        // Should favour routes most like recentRoutes
        let stops = []

        for (let [index, route] of recentRoutes.entries()) {
          let tripStopsByKey = _.keyBy(
            route.trips[0].tripStops,
            stop => stop.stopId
          )

          for (let stopId of [route.boardStopStopId, route.alightStopStopId]) {
            let lnglat = null

            if (stopId in tripStopsByKey) {
              lnglat = tripStopsByKey[stopId].stop.coordinates.coordinates
            } else {
              lnglat = await RequestService.beeline({
                method: 'GET',
                url: '/stops/' + stopId,
              }).then(response => response.data.coordinates.coordinates)
            }

            // Use recency to score the route later, because routes are sorted
            // with most recent bookings first and so we weight those more
            stops.push({
              lnglat,
              recency: Math.pow(2, recentRoutes.length - index),
            })
          }
        }

        return _.orderBy(_.map(routes, scoreRoute(stops)), ['score'], ['desc'])
      },

      sortRoutesBySearchQueries: function (routes, pickUpLocation, dropOffLocation) {
        if (!routes || routes.length === 0) return []

        // Setup pick up and drop off locations as stops to score them
        let stops = []
        if (pickUpLocation) {
          stops.push({
            lnglat: [parseFloat(pickUpLocation.LONGITUDE), parseFloat(pickUpLocation.LATITUDE)],
            recency: 1,
          })
        }

        if (dropOffLocation) {
          stops.push({
            lnglat: [parseFloat(dropOffLocation.LONGITUDE), parseFloat(dropOffLocation.LATITUDE)],
            recency: 1,
          })
        }

        return _.orderBy(_.map(routes, scoreRoute(stops)), ['score'], ['desc'])
      },
    }
  },
])
