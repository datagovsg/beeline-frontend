import querystring from "querystring"
import _ from "lodash"
import assert from "assert"

/**
 * Adapter function to convert what we get from the server into what we want
 * Ideally shouldn't need this if the server stays up to date
 * Transforms the data in place rather than making a new array
 * This is to save time since its a deep copy and you wont need the original array anyway
 *
 * @param {Object} data - the response from the `/routes` endpoint
 * @return {Object}
 *   the response, with time and locations flattened into it from the trip stops
 */
function transformRouteData(data) {
  _(data).each(function(route) {
    for (let trip of route.trips) {
      assert.equal(typeof trip.date, "string")
      trip.date = new Date(trip.date)

      for (let tripStop of trip.tripStops) {
        assert.equal(typeof tripStop.time, "string")
        tripStop.time = new Date(tripStop.time)
      }
    }

    let firstTripStops = route.trips[0].tripStops
    route.startTime = firstTripStops[0].time
    route.startRoad = firstTripStops[0].stop.description
    route.endTime = firstTripStops[firstTripStops.length - 1].time
    route.endRoad = firstTripStops[firstTripStops.length - 1].stop.description
    route.tripsByDate = _.keyBy(route.trips, trip => trip.date.getTime())
  })
  return data
}

angular.module("beeline").factory("RoutesService", [
  "$http",
  "UserService",
  "RequestService",
  "uiGmapGoogleMapApi",
  "$q",
  "p",
  function RoutesService(
    $http,
    UserService,
    RequestService,
    uiGmapGoogleMapApi,
    $q,
    p
  ) {
    // For all routes
    let routesCache
    let activeRoutes
    let recentRoutesCache
    let recentRoutes

    // For single routes
    let lastRouteId = null
    let lastPromise = null

    // For Route Credits
    let routePassesCache
    let tagToPassesMap
    let routePassCache
    let routeToRidesRemainingMap
    let routesWithRoutePassPromise
    let routesWithRoutePass
    let activatedKickstarterRoutes
    let routeToRoutePassTagsPromise = null
    let routeToRoutePassTags = null

    UserService.userEvents.on("userChanged", () => {
      instance.fetchRecentRoutes(true)
      instance.fetchRoutePasses(true)
      instance.fetchRoutesWithRoutePass()
      instance.fetchRecentRoutes(true)
    })

    let instance = {
      // Retrive the data on a single route, but pulls a lot more data
      // Pulls all the trips plus the route path
      // getRoute() will return the heavier stuff (all trips, availability, path)
      getRoute: function(routeId, ignoreCache, options) {
        assert.equal(typeof routeId, "number")

        if (!ignoreCache && !options && lastRouteId === routeId) {
          return lastPromise
        }

        let startDate = new Date()
        startDate.setHours(3, 0, 0, 0, 0)

        let finalOptions = _.assign(
          {
            startDate: startDate.getTime(),
            includeTrips: true,
          },
          options
        )

        lastRouteId = routeId
        return (lastPromise = RequestService.beeline({
          method: "GET",
          url: `/routes/${routeId}?${querystring.stringify(finalOptions)}`,
        })
          .then(function(response) {
            transformRouteData([response.data])
            return response.data
          })
          .catch(err => {
            console.error(err)
          }))
      },

      // Returns list of all routes
      getRoutes: function() {
        return activeRoutes
      },

      // Retrive the data on all the routes
      // But limits the amount of data retrieved
      // getRoutes() now returns a list of routes, but with very limited
      // trip data (limited to 5 trips, no path)
      // Return promise with all routes
      fetchRoutes: function(ignoreCache, options) {
        if (routesCache && !ignoreCache && !options) return routesCache

        let url = "/routes?"

        // Start at midnight to avoid cut trips in the middle
        // FIXME: use date-based search instead
        let startDate = new Date()
        startDate.setHours(3, 0, 0, 0, 0)

        let finalOptions = _.assign(
          {
            startDate: startDate.getTime(),
            includeTrips: true,
            limitTrips: 5,
            includePath: false,
            tags: JSON.stringify(["public"]),
          },
          options,
          p.transportCompanyId
            ? { transportCompanyId: p.transportCompanyId }
            : {}
        )

        url += querystring.stringify(finalOptions)

        let routesPromise = RequestService.beeline({
          method: "GET",
          url: url,
        }).then(function(response) {
          // Checking that we have trips,
          // and that these trips have at least two stops,
          // so that users of it don't choke on trips[0]
          let routes = response.data.filter(
            r =>
              r.trips &&
              r.trips.length &&
              r.trips[0].tripStops &&
              r.trips[0].tripStops.length >= 2
          )
          transformRouteData(routes)
          activeRoutes = routes
          return routes
        })

        // Cache the promise -- prevents two requests from being
        // in flight together
        if (!options) {
          routesCache = routesPromise
        }

        return routesPromise
      },

      /**
      @param {Object} search - search parameters:
      @param {number} search.startLat Starting point latitude
      @param {number} search.startLng Starting point longitude
      @param {number} search.endLat Ending point latitude
      @param {number} search.endLng Ending point longitude
      @param {Date} search.arrivalTime a Date object where the number of seconds
                    since midnight is the desired arrival time at the destination
      @param {Date} search.startTime A Date object.
                  Restricts search results to routes with trips
                  after this time
      @param {Date} search.endTime a Date object.
                  Restrict search results to routes with trips
                  before this time
      @return {Promise}
      **/
      searchRoutes: function(search) {
        // return Promise object
        return RequestService.beeline({
          method: "GET",
          url:
            "/routes/search_by_latlon?" +
            querystring.stringify({
              startLat: search.startLat,
              startLng: search.startLng,
              endLat: search.endLat,
              endLng: search.endLng,
              arrivalTime: search.arrivalTime,
              startTime: search.startTime,
              endTime: search.endTime,
              tags: JSON.stringify(["public"]),
            }),
        }).then(function(response) {
          return transformRouteData(response.data)
        })
      },

      // Retrieves the recent routes for a user
      // If not logged in then just returns an empty array
      fetchRecentRoutes: function(ignoreCache) {
        if (UserService.getUser()) {
          if (recentRoutesCache && !ignoreCache) return recentRoutesCache
          return (recentRoutesCache = RequestService.beeline({
            method: "GET",
            url: "/routes/recent?limit=10",
          }).then(function(response) {
            recentRoutes = response.data
            return recentRoutes
          }))
        } else {
          // if user not logged in clear recentRoutes
          recentRoutes = []
          return $q.resolve([])
        }
      },

      getRecentRoutes: function() {
        return recentRoutes
      },

      // TODO: make a directive, otherwise literoute need to inject this routeservice
      decodeRoutePath: function(path) {
        assert.strictEqual(typeof path, "string")
        return uiGmapGoogleMapApi.then(googleMaps => {
          // Array of LatLng objects
          return googleMaps.geometry.encoding.decodePath(path)
        })
      },

      getRouteFeatures: function(routeId) {
        return RequestService.beeline({
          method: "GET",
          url: `/routes/${routeId}/features`,
        })
          .then(function(response) {
            return response.data
          })
          .catch(err => {
            console.error(err)
          })
      },

      // Return an array of regions covered by a given array of routes
      getUniqueRegionsFromRoutes: function(routes) {
        return _(routes)
          .map(function(route) {
            return route.regions
          })
          .flatten()
          .uniqBy("id")
          .sortBy("name")
          .value()
      },

      // get all route passes associated with the user
      // performs db query where necessary or specified
      // input:
      // - ignoreCache - boolean
      // output:
      // - Promise containing all route passes associated with user
      fetchRoutePasses: function(ignoreCache) {
        if (!ignoreCache && routePassesCache) {
          return routePassesCache
        }
        // Destroy the cache for dependent calls
        // This is a hack
        routesWithRoutePassPromise = null
        routePassCache = null

        let user = UserService.getUser()
        if (!user) {
          return (routePassesCache = Promise.resolve((tagToPassesMap = null)))
        } else {
          return (routePassesCache = RequestService.beeline({
            method: "GET",
            url: "/route_passes",
          }).then(response => {
            return (tagToPassesMap = response.data)
          }))
        }
      },

      // Retrieve route passes information from cache
      // input:
      // - tag - String: tag associated with route. optional
      // output:
      // - Object containing all route passes associated with user
      // - [tag provided] amount of credits specific to the tag
      getRoutePasses: function(tag) {
        if (tag && tagToPassesMap) {
          return tagToPassesMap[tag]
        } else {
          return tagToPassesMap
        }
      },

      // Retrieve the amount of rides remaining for a specific route
      // input:
      // - routeId - number: id of route
      // - creditTag - string: tag associated with route
      // output:
      // - promise containing number of rides remaining on the route pass for specified route
      getRoutePassCount: function() {
        return routeToRidesRemainingMap
      },

      // New more abstracted method which differentiates between 0 and null
      // 0 means user is logged in a no credits found
      // null means not logged in so we don't know
      getPassCountForRoute: function(routeId) {
        if (UserService.getUser()) {
          if (!routeToRidesRemainingMap) return null
          let ridesRemaining = routeToRidesRemainingMap[routeId]
          return ridesRemaining ? ridesRemaining : 0
        } else {
          return null
        }
      },

      // Retrieve the amount of rides remaining for a specific route
      // input:
      // - ignoreCache - boolean to determine if cache should be ignored
      // output:
      // - promise containing a map of routeId to Rides Remaining
      fetchRoutePassCount: function(ignoreCache) {
        if (ignoreCache || !routePassCache) {
          let allRoutesPromise = this.fetchRoutes(ignoreCache)
          let allRoutePassesPromise = this.fetchRoutePasses(ignoreCache)

          routePassCache = $q
            .all([allRoutesPromise, allRoutePassesPromise])
            .then(function(values) {
              let allRoutes = values[0]
              let allRoutePasses = values[1]
              let allRoutePassTags = _.keys(allRoutePasses)
              routeToRidesRemainingMap = {}

              allRoutes.forEach(function(route) {
                let notableTags = _.intersection(route.tags, allRoutePassTags)
                if (notableTags.length < 1) return
                else {
                  // no credit for such route
                  // support multiple tags e.g. crowdstart-140, rp-161
                  // calculate the rides left in the route pass
                  notableTags.forEach(function(tag) {
                    let passesAvailable = allRoutePasses[tag]
                    routeToRidesRemainingMap[route.id] =
                      (routeToRidesRemainingMap[route.id] || 0) +
                      passesAvailable
                  })
                }
              })
              return routeToRidesRemainingMap
            })
        }
        return routePassCache
      },

      // Generates a list of all routes, modifying those with route
      // credits remaining with a "ridesRemaining" property
      // input:
      // - ignoreCache: boolean determining if cache should be ignored.
      // carries over to dependencies fetchRoutes and fetchRoutePassCount
      // output:
      // - promise containing all routes, modified with ridesRemaining property
      // side effect:
      // - updates activatedKickstarterRoutes: array containing only those routes with
      // ridesRemaining property
      // - updates routesWithRoutePass: array containing all avaialable routes,
      // modifying those with route credits remaining with a ridesRemaining property
      fetchRoutesWithRoutePass: function(ignoreCache) {
        if (ignoreCache || !routesWithRoutePassPromise) {
          return (routesWithRoutePassPromise = $q
            .all([
              this.fetchRoutes(ignoreCache),
              this.fetchRoutePassCount(ignoreCache),
            ])
            .then(([allRoutes, routeToRidesRemainingMap]) => {
              if (routeToRidesRemainingMap) {
                routesWithRoutePass = allRoutes.map(route => {
                  let clone = _.clone(route)
                  clone.ridesRemaining =
                    route.id in routeToRidesRemainingMap
                      ? routeToRidesRemainingMap[route.id]
                      : null
                  return clone
                })
                activatedKickstarterRoutes = routesWithRoutePass.filter(
                  route => route.id in routeToRidesRemainingMap
                )

                return routesWithRoutePass
              } else {
                return (routesWithRoutePass = allRoutes)
              }
            }))
        }

        return routesWithRoutePassPromise
      },

      // Returns array containing all avaialable routes,
      // modifying those with route credits remaining with a ridesRemaining property
      // Updated by: fetchRoutesWithRoutePass
      getRoutesWithRoutePass: function() {
        return routesWithRoutePass
      },

      // Returns array containing only those routes with
      // ridesRemaining property
      // Updated by: fetchRoutesWithRoutePass
      getActivatedKickstarterRoutes: function() {
        return activatedKickstarterRoutes
      },

      // Returns promise containing a map of all routeId to their corresponding tags
      // based on the route passes available to a user
      fetchRoutePassTags: function(ignoreCache) {
        if (!ignoreCache && routeToRoutePassTagsPromise) {
          return routeToRoutePassTagsPromise
        }

        let routesPromise = this.fetchRoutesWithRoutePass()
        let routePassesPromise = this.fetchRoutePasses()

        return (routeToRoutePassTagsPromise = $q
          .all([routesPromise, routePassesPromise])
          .then(([routes, routePasses]) => {
            if (routePasses) {
              routeToRoutePassTags = {}
              routes.forEach(route => {
                let routePassTags = _.keys(routePasses)
                let notableTags = _.intersection(route.tags, routePassTags)
                if (notableTags.length >= 1) {
                  // sort in alphabetical order followed by
                  // to encourage use of crowdstart credit before rp-
                  notableTags = _.sortBy(notableTags, function(tag) {
                    return tag
                  })
                  // filter out no balance tag
                  notableTags = _.filter(notableTags, tag => {
                    return routePasses[tag] > 0
                  })
                  routeToRoutePassTags[route.id] = notableTags
                } else {
                  routeToRoutePassTags[route.id] = null
                }
              })

              return routeToRoutePassTags
            } else {
              return (routeToRoutePassTags = null)
            }
          }))
      },

      // Returns the route pass tag matched to a route if routeId is given
      // Otherwise, returns a map of all routeId to their corresponding tags
      // based on the route passes available to a user
      getRoutePassTags: function(routeId) {
        if (routeId && routeToRoutePassTags) {
          return routeToRoutePassTags[routeId]
        } else {
          return routeToRoutePassTags
        }
      },

      fetchPriceSchedule: function(routeId) {
        return RequestService.beeline({
          method: "GET",
          url: `/routes/${routeId}/price_schedule`,
        })
          .then(function(response) {
            let priceSchedules = []
            _.forEach(response.data, (value, key) => {
              let quantity = parseInt(key)
              let singleSchedule = null
              if (quantity === 1) {
                singleSchedule = {
                  quantity: 1,
                  price: parseFloat(value.price),
                  totalPrice: parseFloat(value.price),
                }
              } else {
                // in case no discount is found
                let discount = value.discount || 0
                let price = value.price / quantity
                let originalPrice = discount + value.price
                let computedDiscount =
                  (discount / originalPrice).toFixed(2) * 100
                singleSchedule = {
                  quantity: quantity,
                  price: price,
                  discount: computedDiscount,
                  totalPrice: parseFloat(value.price),
                }
              }
              priceSchedules.push(singleSchedule)
            })
            // sort the schedules from biggest quantity to 1 ticket
            priceSchedules = _.sortBy(priceSchedules, function(schedule) {
              return schedule.quantity
            }).reverse()
            return priceSchedules
          })
          .catch(err => {
            console.error(err)
          })
      },
    }
    return instance
  },
])
