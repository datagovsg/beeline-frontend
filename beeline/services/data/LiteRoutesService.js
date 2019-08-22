/* eslint-disable require-jsdoc */
// get lite routes
// format lite routes with starting time, ending time, no. of timings/trips per day
// retrieve lists of trips running for certain lite route on certain date
// driver pings for list of trips running for this route
// subscriptions for certain lite route ( this may go to tickets service)
import querystring from 'querystring'
import moment from 'moment'
import assert from 'assert'

angular.module('beeline').factory('LiteRoutesService', [
  'RequestService',
  'LiteRouteSubscriptionService',
  'p',
  function LiteRoutesService (RequestService, LiteRouteSubscriptionService, p) {
    let liteRoutesCache

    // For single lite route
    let lastLiteRouteLabel = null
    let lastLiteRoutePromise = null

    let shouldRefreshLiteTickets = false
    let liteRoutes = null

    let inFlightRouteRequests = {}

    // Retrive the data on all lite routes
    // But limits the amount of data retrieved
    // getRoutes() now returns a list of routes, but with very limited
    // trip data (limited to 5 trips, no path)
    // options specifies query parameters to send to `/routes/lite`.
    // if options specified, cache implicitly ignored
    const fetchLiteRoutes = function fetchLiteRoutes (ignoreCache, options) {
      if (liteRoutesCache && !ignoreCache && !options) {
        return liteRoutesCache
      }

      // If transportCompanyId is globally set, eg in GrabShuttle,
      // coerce this option into query params to send
      const transportCompanyIdOptions = p.transportCompanyId
        ? { transportCompanyId: p.transportCompanyId }
        : {}

      const finalOptions = Object.assign(transportCompanyIdOptions, options || {})

      let url = '/routes/lite?' + querystring.stringify(finalOptions)
      let liteRoutesPromise = inFlightRouteRequests[url]

      if (!liteRoutesPromise) {
        const request = RequestService.beeline({
          method: 'GET',
          url,
        })

        liteRoutesPromise = inFlightRouteRequests[url] = request
          .then(response => {
            if (!options) {
              liteRoutes = response.data
            }
            return response.data
          })
          .finally(() => delete inFlightRouteRequests[url])

        // Cache the promise -- prevents two requests from being
        // in flight together
        liteRoutesCache = liteRoutesPromise
      }
      return liteRoutesPromise
    }

    const fetchLiteRoute = function fetchLiteRoute (
      liteRouteLabel,
      ignoreCache
    ) {
      assert.equal(typeof liteRouteLabel, 'string')

      if (!ignoreCache && lastLiteRouteLabel === liteRouteLabel) {
        return lastLiteRoutePromise
      }

      const url = '/routes/lite?' +
        querystring.stringify({
          label: liteRouteLabel,
          startDate: moment().format('YYYY-MM-DD'),
          includePath: true,
        })

      let liteRoutePromise = inFlightRouteRequests[url]

      if (!liteRoutePromise) {
        const request = RequestService.beeline({
          method: 'GET',
          url,
        })
        lastLiteRouteLabel = liteRouteLabel
        lastLiteRoutePromise = liteRoutePromise = inFlightRouteRequests[url] = request
          .then(response => response.data)
          .catch(console.error)
          .finally(() => delete inFlightRouteRequests[url])
      }

      return liteRoutePromise
    }

    return {
      fetchLiteRoutes,
      fetchLiteRoute,
      getLiteRoutes: function () {
        return liteRoutes
      },
      subscribeLiteRoute: function (liteRouteLabel) {
        let subscribePromise = RequestService.beeline({
          method: 'POST',
          url: `/routes/lite/${liteRouteLabel}/subscription`,
        }).then(function (response) {
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
      unsubscribeLiteRoute: function (liteRouteLabel) {
        let unsubscribePromise = RequestService.beeline({
          method: 'DELETE',
          url: `/routes/lite/${liteRouteLabel}/subscription`,
        }).then(function (response) {
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
      getShouldRefreshLiteTickets: function () {
        return shouldRefreshLiteTickets
      },

      clearShouldRefreshLiteTickets: function () {
        shouldRefreshLiteTickets = false
      },
    }
  },
])
