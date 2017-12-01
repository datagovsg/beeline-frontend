import querystring from "querystring"
import _ from "lodash"
import { SafeInterval } from "../SafeInterval"

let transformKickstarterData = function(kickstarterRoutes) {
  if (!kickstarterRoutes) return null
  for (let kickstarter of kickstarterRoutes) {
    kickstarter.isActived = false
    if (kickstarter.bids && kickstarter.bids.length > 0) {
      let bidsByTier = _.groupBy(kickstarter.bids, x => x.priceF)
      kickstarter.notes.tier.map(tier => {
        let countCommitted = bidsByTier[tier.price]
          ? bidsByTier[tier.price].length
          : 0
        _.assign(tier, {
          count: countCommitted,
          moreNeeded: Math.max(tier.pax - countCommitted, 0),
        })
      })
    } else {
      kickstarter.notes.tier.map(tier => {
        _.assign(tier, { count: 0, moreNeeded: tier.pax })
      })
    }
    // order tiers in price desc order
    kickstarter.notes.tier = _.orderBy(
      kickstarter.notes.tier,
      x => x.price,
      "desc"
    )
    // if sb. commit $8, also commit $5
    // kickstarter.notes.tier[1].count += kickstarter.notes.tier[0].count;
    kickstarter.isActived = kickstarter.notes.tier[0].moreNeeded == 0

    kickstarter.isExpired = false
    kickstarter.is7DaysOld = false

    let now = new Date().getTime()
    if (kickstarter.notes && kickstarter.notes.crowdstartExpiry) {
      let expiryTime = new Date(kickstarter.notes.crowdstartExpiry).getTime()
      if (now >= expiryTime) {
        kickstarter.isExpired = true
        if (now - expiryTime >= 7 * 1000 * 60 * 60 * 24) {
          kickstarter.is7DaysOld = true
        }
      } else {
        let day = 1000 * 60 * 60 * 24
        kickstarter.daysLeft = Math.ceil((expiryTime - now) / day)
      }
    }

    // isSuccess / isFailure
    kickstarter.isFailed = kickstarter.tags.indexOf("failed") != -1
    kickstarter.isSuccess = kickstarter.tags.indexOf("success") != -1
    kickstarter.isConverted = kickstarter.isFailed || kickstarter.isSuccess

    // filter only isRunning trips
    // sort trips date in ascending order
    kickstarter.trips = _(kickstarter.trips)
      .filter(x => x.isRunning)
      .orderBy(x => x.date)
      .value()
    // sort tripStops time in ascending order
    _.forEach(kickstarter.trips, function(trip) {
      trip.tripStops = _.orderBy(trip.tripStops, stop => stop.time)
    })

    // calculate the pass expiry date
    kickstarter.passExpired = false
    let firstTripDate = new Date(kickstarter.trips[0].date)
    let passExpiryTime = new Date(
      firstTripDate.getFullYear(),
      firstTripDate.getMonth() + 1,
      firstTripDate.getDate()
    ).getTime()
    kickstarter.passExpired = now >= passExpiryTime
    updateStatus(kickstarter)
  }
  return kickstarterRoutes
}

let updateStatus = function(route) {
  // status of kickstarter
  route.status = ""
  if (route.notes.tier[0].moreNeeded == 0) {
    route.status =
      "Yay! Route is activated at $" +
      route.notes.tier[0].price.toFixed(2) +
      " per trip."
  } else if (!route.isExpired) {
    route.status =
      route.notes.tier[0].moreNeeded +
      " more pax to activate the route at $" +
      route.notes.tier[0].price.toFixed(2) +
      " per trip."
  } else if (route.isSuccess) {
    route.status =
      "Campaign was successful! Check out the running routes for more info"
  } else {
    route.status = "Campaign has expired and the route is not activated."
  }
}

let updateAfterBid = function(route, price) {
  route.notes.tier[0].count = route.notes.tier[0].count + 1
  route.notes.tier[0].moreNeeded = Math.max(
    route.notes.tier[0].moreNeeded - 1,
    0
  )
  route.isActived = route.notes.tier[0].moreNeeded == 0
  updateStatus(route)
}

export default [
  "UserService",
  "$q",
  "RoutesService",
  "p",
  "DevicePromise",
  function KickstarterService(
    UserService,
    $q,
    RoutesService,
    p,
    DevicePromise
  ) {
    let kickstarterRoutesCache
    let bidsCache
    let kickstarterSummary = null
    let bidsById = null
    let kickstarterRoutesList = null
    let kickstarterRoutesById = null
    let nearbyKickstarterRoutesById = null

    UserService.userEvents.on("userChanged", () => {
      fetchBids(true)
      // to load route credits
      RoutesService.fetchRoutePassCount(true)
    })

    // first load
    // every 1 hour should reload kickstarter information
    let timeout = new SafeInterval(refresh, 1000 * 60 * 60, 1000 * 60)

    function refresh() {
      return Promise.all([
        fetchKickstarterRoutes(true),
        fetchBids(true),
        fetchNearbyKickstarterIds(),
      ])
    }

    timeout.start()

    function fetchBids(ignoreCache) {
      if (UserService.getUser()) {
        if (bidsCache && !ignoreCache) return bidsCache
        return (bidsCache = UserService.beeline({
          method: "GET",
          url: "/crowdstart/bids",
        }).then(response => {
          // kickstarterSummary = response.data;
          kickstarterSummary = response.data.map(bid => {
            return {
              routeId: bid.routeId,
              bidPrice: bid.priceF,
              status: bid.status,
            }
          })
          bidsById = _.keyBy(kickstarterSummary, r => r.routeId)
          return kickstarterSummary
        }))
      } else {
        kickstarterSummary = []
        return $q.resolve(kickstarterSummary)
      }
    }

    function fetchKickstarterRoutes(ignoreCache) {
      if (kickstarterRoutesCache && !ignoreCache) return kickstarterRoutesCache
      let url = "/crowdstart/status"
      if (p.transportCompanyId) {
        url +=
          "?" +
          querystring.stringify({ transportCompanyId: p.transportCompanyId })
      }
      return (kickstarterRoutesCache = UserService.beeline({
        method: "GET",
        url: url,
      }).then(response => {
        // return expired kickstarter too
        kickstarterRoutesList = transformKickstarterData(response.data)
        kickstarterRoutesById = _.keyBy(kickstarterRoutesList, "id")
        return kickstarterRoutesList
      }))
    }

    function getLocationPromise(enableHighAccuracy = false) {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          success => resolve(success),
          error => reject(error),
          { enableHighAccuracy }
        )
      })
    }

    async function fetchNearbyKickstarterIds() {
      let locationOrNull = null
      try {
        await DevicePromise
        locationOrNull = await getLocationPromise(false)
      } catch (err) {
        // Location not found -- suppress error
        nearbyKickstarterRoutesById = nearbyKickstarterRoutesById || null
        return new Promise((resolve, reject) => {
          resolve(nearbyKickstarterRoutesById)
        })
      }

      let coords = {
        latitude: locationOrNull.coords.latitude,
        longitude: locationOrNull.coords.longitude,
      }

      let nearbyPromise = UserService.beeline({
        method: "GET",
        url:
          "/routes/search_by_latlon?" +
          querystring.stringify(
            _.assign(
              {
                maxDistance: 2000,
                startTime: Date.now(),
                tags: JSON.stringify(["crowdstart"]),
                startLat: coords.latitude,
                startLng: coords.longitude,
              },
              p.transportCompanyId
                ? { transportCompanyId: p.transportCompanyId }
                : {}
            )
          ),
      })

      let nearbyReversePromise = UserService.beeline({
        method: "GET",
        url:
          "/routes/search_by_latlon?" +
          querystring.stringify(
            _.assign(
              {
                maxDistance: 2000,
                startTime: Date.now(),
                tags: JSON.stringify(["crowdstart"]),
                endLat: coords.latitude,
                endLng: coords.longitude,
              },
              p.transportCompanyId
                ? { transportCompanyId: p.transportCompanyId }
                : {}
            )
          ),
      })
      return Promise.all([nearbyPromise, nearbyReversePromise]).then(values => {
        let [np, nvp] = values
        return (nearbyKickstarterRoutesById = _(np.data.concat(nvp.data))
          .map(r => r.id)
          .uniq()
          .value())
      })
    }

    return {
      // all crowdstart routes
      getCrowdstart: () => kickstarterRoutesList,
      fetchCrowdstart: ignoreCache => fetchKickstarterRoutes(ignoreCache),

      getCrowdstartById: function(routeId) {
        return kickstarterRoutesById ? kickstarterRoutesById[routeId] : null
      },

      // user personal bid information
      getBids: function() {
        return kickstarterSummary
      },
      fetchBids: ignoreCache => fetchBids(ignoreCache),

      isBid: function(routeId) {
        return bidsById && bidsById[routeId] ? true : false
      },

      getBidInfo: function(routeId) {
        return kickstarterSummary
          ? kickstarterSummary.find(x => x.routeId == routeId)
          : null
      },

      // need to return a promise
      hasBids: function() {
        return bidsCache.then(() => {
          return (
            kickstarterSummary &&
            kickstarterSummary.length > 0 &&
            kickstarterSummary.find(x => x.status === "bidded")
          )
        })
      },

      createBid: function(route, boardStopId, alightStopId, bidPrice) {
        return UserService.beeline({
          method: "POST",
          url: `/crowdstart/routes/${route.id}/bids`,
          data: {
            price: bidPrice,
          },
        }).then(response => {
          updateAfterBid(kickstarterRoutesById[route.id], bidPrice)
          kickstarterSummary = kickstarterSummary.concat([
            {
              routeId: route.id,
              bidPrice: bidPrice,
              status: "bidded",
            },
          ])
          return response.data
        })
      },

      getNearbyKickstarterIds: () => {
        return nearbyKickstarterRoutesById
      },

      fetchNearbyKickstarterIds: fetchNearbyKickstarterIds,
    }
  },
]
