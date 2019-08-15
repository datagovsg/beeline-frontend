import querystring from 'querystring'
import _ from 'lodash'
import { SafeInterval } from '../../SafeInterval'

let transformCrowdstartData = function (crowdstartRoutes) {
  if (!crowdstartRoutes) return null
  for (let crowdstart of crowdstartRoutes) {
    crowdstart.isActived = false
    if (crowdstart.bids && crowdstart.bids.length > 0) {
      let bidsByTier = _.groupBy(crowdstart.bids, x => x.priceF)
      crowdstart.notes.tier.map(tier => {
        let countCommitted = bidsByTier[tier.price]
          ? bidsByTier[tier.price].length
          : 0
        _.assign(tier, {
          count: countCommitted,
          moreNeeded: Math.max(tier.pax - countCommitted, 0),
        })
      })
    } else {
      crowdstart.notes.tier.map(tier => {
        _.assign(tier, { count: 0, moreNeeded: tier.pax })
      })
    }
    // order tiers in price desc order
    crowdstart.notes.tier = _.orderBy(
      crowdstart.notes.tier,
      x => x.price,
      'desc'
    )
    // if sb. commit $8, also commit $5
    // crowdstart.notes.tier[1].count += crowdstart.notes.tier[0].count;
    crowdstart.isActived = crowdstart.notes.tier[0].moreNeeded === 0

    crowdstart.isExpired = false
    crowdstart.is7DaysOld = false

    let now = new Date().getTime()
    if (crowdstart.notes && crowdstart.notes.crowdstartExpiry) {
      let expiryTime = new Date(crowdstart.notes.crowdstartExpiry).getTime()
      if (now >= expiryTime) {
        crowdstart.isExpired = true
        if (now - expiryTime >= 7 * 1000 * 60 * 60 * 24) {
          crowdstart.is7DaysOld = true
        }
      } else {
        let day = 1000 * 60 * 60 * 24
        crowdstart.daysLeft = Math.ceil((expiryTime - now) / day)
      }
    }

    // isSuccess / isFailure
    crowdstart.isFailed = crowdstart.tags.indexOf('failed') !== -1
    crowdstart.isSuccess = crowdstart.tags.indexOf('success') !== -1
    crowdstart.isConverted = crowdstart.isFailed || crowdstart.isSuccess

    // filter only isRunning trips
    // sort trips date in ascending order
    crowdstart.trips = _(crowdstart.trips)
      .filter(x => x.isRunning)
      .orderBy(x => x.date)
      .value()
    // sort tripStops time in ascending order
    _.forEach(crowdstart.trips, function (trip) {
      trip.tripStops = _.orderBy(trip.tripStops, stop => stop.time)
    })

    // calculate the pass expiry date
    crowdstart.passExpired = false
    let firstTripDate = new Date(crowdstart.trips[0].date)
    let passExpiryTime = new Date(
      firstTripDate.getFullYear(),
      firstTripDate.getMonth() + 1,
      firstTripDate.getDate()
    ).getTime()
    crowdstart.passExpired = now >= passExpiryTime
    updateStatus(crowdstart)
  }
  return crowdstartRoutes
}

let updateStatus = function (route) {
  // status of crowdstart
  route.status = ''
  if (route.notes.tier[0].moreNeeded === 0) {
    route.status =
      'Yay! Route is activated at $' +
      route.notes.tier[0].price.toFixed(2) +
      ' per trip.'
  } else if (!route.isExpired) {
    route.status =
      route.notes.tier[0].moreNeeded +
      ' more pax to activate the route at $' +
      route.notes.tier[0].price.toFixed(2) +
      ' per trip.'
  } else if (route.isSuccess) {
    route.status =
      'Campaign was successful! Check out the running routes for more info'
  } else {
    route.status = 'Campaign has expired and the route is not activated.'
  }
}

let updateAfterBid = function (route, price) {
  route.notes.tier[0].count = route.notes.tier[0].count + 1
  route.notes.tier[0].moreNeeded = Math.max(
    route.notes.tier[0].moreNeeded - 1,
    0
  )
  route.isActived = route.notes.tier[0].moreNeeded === 0
  updateStatus(route)
}

angular.module('beeline').service('CrowdstartService', [
  'UserService',
  'RequestService',
  '$q',
  'RoutesService',
  'p',
  'DevicePromise',
  function CrowdstartService (
    UserService,
    RequestService,
    $q,
    RoutesService,
    p,
    DevicePromise
  ) {
    let crowdstartRoutesCache
    let bidsCache
    let crowdstartSummary = null
    let bidsById = null
    let crowdstartPreview = null
    let crowdstartRoutesList = null
    let crowdstartRoutesById = null
    const beelineCompanyId = 2

    const fetchBids = function fetchBids (ignoreCache) {
      if (UserService.getUser()) {
        if (bidsCache && !ignoreCache) return bidsCache
        return (bidsCache = RequestService.beeline({
          method: 'GET',
          url: '/crowdstart/bids',
        }).then(response => {
          crowdstartSummary = response.data.map(bid => {
            return {
              routeId: bid.routeId,
              bidPrice: bid.priceF,
              status: bid.status,
            }
          })
          bidsById = _.keyBy(crowdstartSummary, r => r.routeId)
          return crowdstartSummary
        }))
      } else {
        crowdstartSummary = []
        return $q.resolve(crowdstartSummary)
      }
    }

    const fetchCrowdstartRoutes = function fetchCrowdstartRoutes (ignoreCache) {
      if (crowdstartRoutesCache && !ignoreCache) return crowdstartRoutesCache
      let url = '/crowdstart/status'
      let requests = []

      // If grabshuttle app, request for beeline's crowdstart routes
      if (p.transportCompanyId) {
        requests.push('?' + querystring.stringify({ transportCompanyId: p.transportCompanyId }))
        requests.push('?' + querystring.stringify({ transportCompanyId: beelineCompanyId }))
      } else {
        requests.push('')
      }
      requests = requests.map(qs => {
        return RequestService.beeline({
          method: 'GET',
          url: url + qs,
        })
      })
      return (crowdstartRoutesCache = Promise.all(requests).then(responses => {
        let routes = responses[0].data
        if (p.transportCompanyId) {
          routes = routes.concat(responses[1].data)
        }
        // return expired crowdstart too
        crowdstartRoutesList = transformCrowdstartData(routes)
        crowdstartRoutesById = _.keyBy(crowdstartRoutesList, 'id')
        return crowdstartRoutesList
      }))
    }

    UserService.userEvents.on('userChanged', () => {
      fetchBids(true)
    })

    const refresh = function refresh () {
      return Promise.all([
        fetchCrowdstartRoutes(true),
        fetchBids(true),
      ])
    }

    // first load
    // every 1 hour should reload crowdstart information
    let timeout = new SafeInterval(refresh, 1000 * 60 * 60, 1000 * 60)
    timeout.start()

    let lastPrivateCrowdstartRouteId
    let lastPrivateCrowdstartRoutePromise = Promise.resolve({})

    const getPrivateCrowdstartById = function getPrivateCrowdstartById (
      routeId
    ) {
      if (lastPrivateCrowdstartRouteId !== routeId) {
        lastPrivateCrowdstartRouteId = routeId
        lastPrivateCrowdstartRoutePromise = Promise.all([
          RoutesService.getRoute(routeId),
          RequestService.beeline({
            method: 'GET',
            url: `/crowdstart/routes/${routeId}/bids`,
          }).then(response => response.data),
        ])
          .then(([route, bids]) => {
            if (!route || !bids) {
              return
            }
            route.bids = bids
            transformCrowdstartData([route])
            return route
          })
          .catch(console.error)
      }
      return lastPrivateCrowdstartRoutePromise
    }

    return {
      // all crowdstart routes
      getCrowdstart: () => crowdstartRoutesList,
      fetchCrowdstart: ignoreCache => fetchCrowdstartRoutes(ignoreCache),

      getCrowdstartById: function (routeId) {
        if (routeId === 'preview') {
          transformCrowdstartData([crowdstartPreview])
          return crowdstartPreview
        }
        if (!crowdstartRoutesById) {
          return null
        }
        return crowdstartRoutesById[routeId]
          ? crowdstartRoutesById[routeId]
          : getPrivateCrowdstartById(routeId)
      },

      getCrowdstartRoutesById: function () {
        return crowdstartRoutesById
      },

      setCrowdstartPreview: function (route) {
        crowdstartPreview = route
      },

      // user personal bid information
      getBids: function () {
        return crowdstartSummary
      },
      fetchBids: ignoreCache => fetchBids(ignoreCache),

      isBid: function (routeId) {
        return !!(bidsById && bidsById[routeId])
      },

      getBidInfo: function (routeId) {
        return crowdstartSummary
          ? crowdstartSummary.find(x => x.routeId === routeId)
          : null
      },

      // need to return a promise
      hasBids: function () {
        return bidsCache.then(() => {
          return (
            crowdstartSummary &&
            crowdstartSummary.length > 0 &&
            crowdstartSummary.find(x => x.status === 'bidded')
          )
        })
      },

      createBid: function (route, boardStopId, alightStopId, bidPrice) {
        return RequestService.beeline({
          method: 'POST',
          url: `/crowdstart/routes/${route.id}/bids`,
          data: {
            price: bidPrice,
          },
        }).then(response => {
          updateAfterBid(route, bidPrice)
          crowdstartSummary = crowdstartSummary.concat([
            {
              routeId: route.id,
              bidPrice: bidPrice,
              status: 'bidded',
            },
          ])
          return response.data
        })
      },

      deleteBid: async function (route) {
        let user = UserService.getUser()
        if (!user) return

        let userBids = route.bids.filter(bid => bid.userId === user.id)

        if (!userBids || userBids.length !== 1) return

        return RequestService.beeline({
          method: 'DELETE',
          url: `/crowdstart/routes/${route.id}/bids`,
        }).then(response => {
          return response.data
        })
      },
    }
  },
])
