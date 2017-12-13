// get lite routes
// format lite routes with starting time, ending time, no. of timings/trips per day
// retrieve lists of trips running for certain lite route on certain date
// driver pings for list of trips running for this route
// subscriptions for certain lite route ( this may go to tickets service)
import querystring from "querystring"
import _ from "lodash"
import assert from "assert"

angular.module("beeline").factory("LiteRoutesService", [
  "UserService",
  "LiteRouteSubscriptionService",
  "p",
  function LiteRoutesService(UserService, LiteRouteSubscriptionService, p) {
    let liteRoutesCache

    // For single lite route
    let lastLiteRouteLabel = null
    let lastLiteRoutePromise = null

    let shouldRefreshLiteTickets = false
    let liteRoutes = null

    function transformTime(liteRoutesByLabel) {
      for (let label in liteRoutesByLabel) {
        if ({}.hasOwnProperty.call(liteRoutesByLabel, label)) {
          let liteRoute = liteRoutesByLabel[label]
          // no starting time and ending time
          if (!liteRoute.trips) {
            liteRoute.startTime = null
            liteRoute.endTime = null
            return
          }
          let minTripDate = _.min(liteRoute.trips.map(trip => trip.date))
          let tripAsMinTripDate = liteRoute.trips.filter(
            trip => trip.date === minTripDate
          )
          let tripStops = _.flatten(
            tripAsMinTripDate.map(trip => trip.tripStops || [])
          )
          let allStopTimes = tripStops.map(stop => stop.time).sort()
          liteRoute.startTime = allStopTimes[0]
          liteRoute.endTime = allStopTimes[allStopTimes.length - 1]
        }
      }
    }

    // TODO the same label lite route all data fileds should be the same except trips
    // otherwise reduce make no sense
    function transformLiteRouteData(data) {
      let liteRoutesByLabel = _.reduce(
        data,
        function(result, value, key) {
          let label = value.label
          if (result[label] && (result[label].trips || value.trips)) {
            result[label].trips = result[label].trips.concat(value.trips)
          } else {
            result[label] = value
            // mark isSubscribed as false
            result[label].isSubscribed = false
          }
          return result
        },
        {}
      )
      transformTime(liteRoutesByLabel)
      // ignor the startingTime and endTime for now
      return liteRoutesByLabel
    }

    // consolidate tripstops for lite route
    // aggregate stop time for stops
    function computeLiteStops(trips) {
      let tripStops = _.map(trips, trip => {
        return trip.tripStops
      })
      let allTripStops = _.flatten(tripStops)

      let boardStops = _.groupBy(allTripStops, function(tripStop) {
        return tripStop.stop.id
      })
      let newStops = []
      for (let stopId in boardStops) {
        if ({}.hasOwnProperty.call(boardStops, stopId)) {
          let stop = boardStops[stopId][0].stop
          stop.canBoard = boardStops[stopId][0].canBoard
          let timeArray = _.map(boardStops[stopId], stop => {
            return stop.time
          })
          let sortedTime = _(timeArray)
            .uniq()
            .sort()
            .value()
          newStops.push(_.extend({ time: sortedTime }, stop))
        }
      }
      return newStops
    }

    // Retrive the data on all lite routes
    // But limits the amount of data retrieved
    // getRoutes() now returns a list of routes, but with very limited
    // trip data (limited to 5 trips, no path)
    function fetchLiteRoutes(ignoreCache, options) {
      if (liteRoutesCache && !ignoreCache && !options) return liteRoutesCache

      let url = "/routes?"

      // Start at midnight to avoid cut trips in the middle
      // FIXME: use date-based search instead
      let startDate = new Date()
      startDate.setHours(3, 0, 0, 0, 0)

      let finalOptions = _.assign(
        {
          startDate: startDate.getTime(),
          includePath: true,
          includeTrips: true,
          limitTrips: 5,
          tags: JSON.stringify(["lite"]),
        },
        options,
        p.transportCompanyId ? { transportCompanyId: p.transportCompanyId } : {}
      )

      url += querystring.stringify(finalOptions)

      let liteRoutesPromise = UserService.beeline({
        method: "GET",
        url: url,
      }).then(function(response) {
        // Checking that we have trips, so that users of it don't choke
        // on trips[0]
        liteRoutes = response.data.filter(r => r.trips && r.trips.length)
        liteRoutes = transformLiteRouteData(liteRoutes)
        return liteRoutes
      })

      // Cache the promise -- prevents two requests from being
      // in flight together
      if (!options) {
        liteRoutesCache = liteRoutesPromise
      }
      return liteRoutesPromise
    }

    function fetchLiteRoute(liteRouteLabel, ignoreCache, options) {
      assert.equal(typeof liteRouteLabel, "string")

      if (!ignoreCache && !options && lastLiteRouteLabel === liteRouteLabel) {
        return lastLiteRoutePromise
      }

      let startDate = new Date()
      startDate.setHours(3, 0, 0, 0, 0)

      let finalOptions = _.assign(
        {
          startDate: startDate.getTime(),
          includeTrips: true,
          tags: JSON.stringify(["lite"]),
          label: liteRouteLabel,
          includePath: true,
        },
        options,
        p.transportCompanyId ? { transportCompanyId: p.transportCompanyId } : {}
      )

      let url = "/routes?"
      url += querystring.stringify(finalOptions)

      lastLiteRouteLabel = liteRouteLabel
      return (lastLiteRoutePromise = UserService.beeline({
        method: "GET",
        url: url,
      })
        .then(function(response) {
          let liteRouteData = transformLiteRouteData(response.data)
          return liteRouteData
        })
        .catch(err => {
          console.error(err)
        }))
    }

    return {
      fetchLiteRoutes: fetchLiteRoutes,
      fetchLiteRoute: fetchLiteRoute,
      getLiteRoutes: function() {
        return liteRoutes
      },
      subscribeLiteRoute: function(liteRouteLabel) {
        let subscribePromise = UserService.beeline({
          method: "POST",
          url: "/liteRoutes/subscriptions",
          data: {
            routeLabel: liteRouteLabel,
          },
        }).then(function(response) {
          shouldRefreshLiteTickets = true
          if (response.data) {
            LiteRouteSubscriptionService.getSubscriptionSummary().push(
              liteRouteLabel
            )
            return true
          } else {
            return false
          }
        })
        return subscribePromise
      },
      unsubscribeLiteRoute: function(liteRouteLabel) {
        let unsubscribePromise = UserService.beeline({
          method: "DELETE",
          url: "/liteRoutes/subscriptions/" + liteRouteLabel,
        }).then(function(response) {
          shouldRefreshLiteTickets = true
          if (response.data) {
            let index = LiteRouteSubscriptionService.getSubscriptionSummary().indexOf(
              liteRouteLabel
            )
            LiteRouteSubscriptionService.getSubscriptionSummary().splice(
              index,
              1
            )
            return true
          } else {
            return false
          }
        })
        return unsubscribePromise
      },
      getShouldRefreshLiteTickets: function() {
        return shouldRefreshLiteTickets
      },

      clearShouldRefreshLiteTickets: function() {
        shouldRefreshLiteTickets = false
      },
      transformLiteRouteData: transformLiteRouteData,
      computeLiteStops: computeLiteStops,
    }
  },
])
