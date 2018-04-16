/* eslint-disable require-jsdoc */
// get lite routes
// format lite routes with starting time, ending time, no. of timings/trips per day
// retrieve lists of trips running for certain lite route on certain date
// driver pings for list of trips running for this route
// subscriptions for certain lite route ( this may go to tickets service)
import querystring from "querystring"
import moment from "moment"
import assert from "assert"

angular.module("beeline").factory("LiteRoutesService", [
  "RequestService",
  "LiteRouteSubscriptionService",
  "p",
  function LiteRoutesService(RequestService, LiteRouteSubscriptionService, p) {
    let liteRoutesCache

    // For single lite route
    let lastLiteRouteLabel = null
    let lastLiteRoutePromise = null

    let shouldRefreshLiteTickets = false
    let liteRoutes = null

    // Retrive the data on all lite routes
    // But limits the amount of data retrieved
    // getRoutes() now returns a list of routes, but with very limited
    // trip data (limited to 5 trips, no path)
    function fetchLiteRoutes(ignoreCache) {
      if (liteRoutesCache && !ignoreCache) {
        return liteRoutesCache
      }

      let finalOptions = p.transportCompanyId
        ? { transportCompanyId: p.transportCompanyId }
        : {}

      let liteRoutesPromise = RequestService.beeline({
        method: "GET",
        url: "/routes/lite?" + querystring.stringify(finalOptions),
      }).then(response => {
        liteRoutes = response.data
        return liteRoutes
      })

      // Cache the promise -- prevents two requests from being
      // in flight together
      liteRoutesCache = liteRoutesPromise
      return liteRoutesPromise
    }

    function fetchLiteRoute(liteRouteLabel, ignoreCache) {
      assert.equal(typeof liteRouteLabel, "string")

      if (!ignoreCache && lastLiteRouteLabel === liteRouteLabel) {
        return lastLiteRoutePromise
      }

      lastLiteRouteLabel = liteRouteLabel
      return (lastLiteRoutePromise = RequestService.beeline({
        method: "GET",
        url:
          "/routes/lite?" +
          querystring.stringify({
            label: liteRouteLabel,
            startDate: moment().format("YYYY-MM-DD"),
            includePath: true,
          }),
      })
        .then(response => response.data)
        .catch(err => {
          console.error(err)
        }))
    }

    return {
      fetchLiteRoutes,
      fetchLiteRoute,
      getLiteRoutes: function() {
        return liteRoutes
      },
      subscribeLiteRoute: function(liteRouteLabel) {
        let subscribePromise = RequestService.beeline({
          method: "POST",
          url: `/routes/lite/${liteRouteLabel}/subscription`,
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
        let unsubscribePromise = RequestService.beeline({
          method: "DELETE",
          url: `/routes/lite/${liteRouteLabel}/subscription`,
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
    }
  },
])
