import _ from 'lodash'
import { sleep } from '../shared/util'
import querystring from 'querystring'
import moment from 'moment-timezone'

export default [
  '$scope',
  '$q',
  '$state',
  '$rootScope',
  'RoutesService',
  'CrowdstartService',
  'LiteRoutesService',
  'LiteRouteSubscriptionService',
  'SearchService',
  'BookingService',
  'SearchEventService',
  'RequestService',
  '$window',
  'OneMapPlaceService',
  '$ionicHistory',
  '$location',
  '$anchorScroll',
  '$timeout',
  function (
    // Angular Tools
    $scope,
    $q,
    $state,
    $rootScope,
    // Route Information
    RoutesService,
    CrowdstartService,
    LiteRoutesService,
    // Misc
    LiteRouteSubscriptionService,
    SearchService,
    BookingService,
    SearchEventService,
    RequestService,
    $window,
    OneMapPlaceService,
    $ionicHistory,
    $location,
    $anchorScroll,
    $timeout
  ) {
    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------
    const addExpiryToRoute = function addExpiryToRoute (
      route,
      routePassTags,
      routePassExpiries
    ) {
      let expiries = {}
      if (!routePassTags[route.id]) {
        return route
      }

      for (let tag of routePassTags[route.id]) {
        _.assign(expiries, routePassExpiries[tag])
      }
      let dates = Object.keys(expiries).map(date => {
        return moment(date)
      })

      dates.sort()

      // Get the closest expiry date
      // Add one day because the route pass expires at the end of the day
      route.expiry = dates[0].add(1, 'days').diff(moment(), 'days')

      return route
    }

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    // Explicitly declare/initialize of scope variables we use
    $scope.data = {
      placeQuery: null, // The place object used to search
      queryText: '', // The actual text in the box
      // Different types of route data
      routesWithRidesRemaining: null,
      backedCrowdstartRoutes: null,
      recentRoutes: null,
      recentRoutesById: null,
      liteRoutes: null,
      subscribedLiteRoutes: null,
      routes: null,
      crowdstartRoutes: null,
      isFiltering: null,
      routesYouMayLike: null,
      routesAvailable: false,
      pickUpLocation: null,
      dropOffLocation: null,
    }

    $scope.disp = {
      yourRoutes: $ionicHistory.currentStateName() === 'tabs.yourRoutes',
      title:
        $ionicHistory.currentStateName() === 'tabs.yourRoutes'
          ? 'Your Routes'
          : 'Search Routes',
      searchFromTo: true,
      routes: null,
      liteRoutes: null,
      crowdstartRoutes: null,
      routesWithRidesRemaining: null,
    }

    // ------------------------------------------------------------------------
    // Ionic events
    // ------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
      // Refresh routes on enter for routes in case we did something that
      // changed my routes e.g. unsubscribing lite route, booking a route,
      // withdrawing from crowdstart
      $scope.refreshRoutes(true)
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    const autoComplete = function autoComplete () {
      if (!$scope.data.queryText || $scope.data.queryText.length < 3) {
        $scope.data.placeQuery = null
        $scope.data.isFiltering = false
        $scope.$digest()
        return
      }

      // show the spinner
      $scope.data.isFiltering = true
      $scope.$digest()

      // default 'place' object only has 'queryText' but no geometry
      let place = { queryText: $scope.data.queryText }
      SearchEventService.emit('search-item', $scope.data.queryText)

      $scope.data.placeQuery = place
      $scope.$digest()

      OneMapPlaceService.handleQuery(
        $scope.data.queryText
      ).then(place => {
        if (!place) return

        $scope.data.placeQuery = place
        $scope.$digest()
      }).then(async () => {
        await sleep(500)
        $scope.data.isFiltering = false
        $scope.$digest()
      })
    }

    $scope.$watch(
      'data.queryText',
      _.debounce(autoComplete, 300, {
        leading: false,
        trailing: true,
      })
    )

    $scope.$watch('data.queryText', queryText => {
      if (queryText.length === 0) $scope.data.isFiltering = true
    })

    // Recent routes
    // Need to pull in the "full" data from all routes
    $scope.$watchGroup(
      [
        () => RoutesService.getRecentRoutes(),
        () => RoutesService.getRoutesWithRoutePass(),
        () => RoutesService.getPrivateRoutesWithRoutePass(),
      ],
      ([recentRoutes, allRoutes, privateRoutes]) => {
        // If we cant find route data here then proceed with empty
        // This allows it to organically "clear" any state
        if (!recentRoutes || !allRoutes || !privateRoutes) return

        // "Fill in" the recent routes with the all routes data
        let allRoutesById = _.keyBy(allRoutes, 'id')
        let privateRoutesById = _.keyBy(privateRoutes, 'id')
        $scope.data.recentRoutes = recentRoutes
          .map(recentRoute => {
            return _.assign(
              {
                alightStopStopId: recentRoute.alightStopStopId,
                boardStopStopId: recentRoute.boardStopStopId,
              },
              allRoutesById[recentRoute.id] || privateRoutesById[recentRoute.id]
            )
            // Clean out "junk" routes which may be old/obsolete
          })
          .filter(route => route && route.id !== undefined)
        $scope.data.recentRoutesById = _.keyBy($scope.data.recentRoutes, 'id')
      }
    )

    // Crowdstarted routes
    $scope.$watchGroup(
      [
        () => RoutesService.getRoutesWithRidesRemaining(),
        () => RoutesService.getPrivateRoutesWithRidesRemaining(),
        'data.recentRoutesById',
      ],
      ([routes, privateRoutes, recentRoutesById]) => {
        // Input validation
        if (!routes || !privateRoutes) return

        // Merge public and private routes
        routes = _.concat(routes, privateRoutes)

        // Publish
        const recentRouteIds = Object.keys(recentRoutesById || {})
        $scope.data.routesWithRidesRemaining = routes.filter(
          route => !recentRouteIds.map(Number).includes(route.id)
        )

        // Publish shallow copy to disp.routesWithRidesRemaining
        $scope.disp.routesWithRidesRemaining = _.clone($scope.data.routesWithRidesRemaining)
      }
    )

    $scope.$watchGroup(
      [
        () => CrowdstartService.getBids(),
        () => CrowdstartService.getCrowdstartRoutesById(),
      ],
      async ([bids, crowdstartRoutesById]) => {
        if (!bids || !crowdstartRoutesById) return

        const crowdstarts = await Promise.all(
          bids.map(bid => CrowdstartService.getCrowdstartById(bid.routeId))
        )
        $scope.data.backedCrowdstartRoutes = crowdstarts.filter(
          route =>
            (!route.passExpired && route.isActived) ||
            !route.isExpired ||
            !route.is7DaysOld
        )
      }
    )

    // pull interested routes based on recently booking
    // assumption on 'AM from' and 'PM to' stop as 'home place / target place'
    // search based on target with radius of 500m
    // reset to null if user use search bar
    $scope.$watchGroup(
      [
        'data.recentRoutesById',
        'data.routes',
        'data.liteRoutes',
        'data.crowdstartRoutes',
      ],
      async ([recentRoutesById, routes, liteRoutes, crowdstartRoutes]) => {
        if (recentRoutesById && routes && liteRoutes && crowdstartRoutes) {
          // set id for lite routes so that we can publish unique routes
          // (see end of this function)
          liteRoutes.map(route => {
            route.id = route.routeIds
          })
          let placeResults = []
          for (let id in recentRoutesById) {
            // https://eslint.org/docs/rules/guard-for-in
            if (Object.prototype.hasOwnProperty.call(recentRoutesById, id)) {
              let route = recentRoutesById[id]
              let lnglat = null
              let tripStopsByKey = _.keyBy(
                route.trips[0].tripStops,
                stop => stop.stopId
              )

              let stopId =
                route.startTime && moment(route.startTime).format('A') === 'AM'
                  ? route.boardStopStopId
                  : route.alightStopStopId

              if (stopId in tripStopsByKey) {
                lnglat = tripStopsByKey[stopId].stop.coordinates.coordinates
              } else {
                lnglat = await RequestService.beeline({
                  method: 'GET',
                  url: '/stops/' + stopId,
                }).then(response => response.data.coordinates.coordinates)
              }

              let results = SearchService.filterRoutesByLngLat(
                _.concat(routes, crowdstartRoutes),
                lnglat,
                500
              )
              let filteredLiteRoutes = SearchService.filterRoutesByLngLat(
                liteRoutes,
                lnglat,
                2000
              )
              placeResults = _.concat(placeResults, results, filteredLiteRoutes)
            }
          }

          // filter recently booked route ids
          _.remove(placeResults, x => {
            return recentRoutesById[x.id]
          })

          placeResults = await SearchService.sortRoutes(
            $scope.data.recentRoutes,
            placeResults
          )

          // publish unique routes
          $scope.data.routesYouMayLike = _.uniqBy(placeResults, 'id')
        }
      }
    )

    // Lite routes
    $scope.$watchGroup(
      [
        () => LiteRoutesService.getLiteRoutes(),
        () => LiteRouteSubscriptionService.getSubscriptionSummary(),
      ],
      ([liteRoutes, subscribed]) => {
        // Input validation
        if (!liteRoutes || !subscribed) return
        liteRoutes = Object.values(liteRoutes)

        let subscribedLiteRoutes = _.filter(liteRoutes, route => {
          return !!subscribed.includes(route.label)
        })
        // Sort by label and publish
        $scope.data.subscribedLiteRoutes = _.sortBy(
          subscribedLiteRoutes,
          route => {
            return parseInt(route.label.slice(1))
          }
        )

        // Add the subscription information
        _.forEach(liteRoutes, liteRoute => {
          liteRoute.isSubscribed = Boolean(subscribed.includes(liteRoute.label))
        })
        // Sort by label and publish
        $scope.data.liteRoutes = _.sortBy(liteRoutes, route => {
          return parseInt(route.label.slice(1))
        })

        // Publish shallow copy to disp.liteRoutes
        $scope.disp.liteRoutes = _.clone($scope.data.liteRoutes)
      }
    )

    // Normal routes
    // Sort them by start time
    $scope.$watchGroup(
      [
        () => RoutesService.getRoutesWithRoutePass(),
      ],
      ([allRoutes]) => {
        // Input validation
        if (!allRoutes) return

        // Sort the routes by the time of day
        $scope.data.routes = _.sortBy(allRoutes, 'label', route => {
          const firstTripStop = _.get(route, 'trips[0].tripStops[0]')
          const midnightOfTrip = new Date(firstTripStop.time.getTime())
          midnightOfTrip.setHours(0, 0, 0, 0)
          return firstTripStop.time.getTime() - midnightOfTrip.getTime()
        })

        // publish shallow copy to disp.routes
        $scope.disp.routes = _.clone($scope.data.routes)
      }
    )

    // Unactivated crowdstart routes
    $scope.$watchGroup(
      [
        () => CrowdstartService.getCrowdstart(),
        () => CrowdstartService.getBids(),
      ],
      ([routes, bids]) => {
        if (!routes || !bids) return

        // Filter out the expired routes
        routes = routes.filter(route => !route.isExpired)

        // Filter out the routes the user bidded on
        // These are already shown elsewhere
        let biddedRouteIds = bids.map(bid => bid.routeId)

        // Filter out routes that have already been bidded on
        routes = routes.filter(route => {
          return !biddedRouteIds.includes(route.id)
        })

        // Map to scope once done
        $scope.data.crowdstartRoutes = routes

        // Publish shallow copy to disp.crowdstartRoutes
        $scope.disp.crowdstartRoutes = _.clone(routes)
      }
    )

    let unbindWatchGroup = $scope.$watch(
      () => $scope.hasPersonalRoutes(),
      hasPersonalRoutes => {
        if (
          $ionicHistory.currentStateName() === 'tabs.yourRoutes' &&
          !hasPersonalRoutes
        ) {
          // After redirecting once we can unbind the watcher
          unbindWatchGroup()
          $state.go('tabs.routes')
        }
      }
    )

    // Hides the animated loading routes
    $scope.$watchGroup(
      [
        'data.routes',
        'data.routesWithRidesRemaining',
        'data.backedCrowdstartRoutes',
        'data.recentRoutes',
        'data.liteRoutes',
        'data.subscribedLiteRoutes',
        'data.crowdstartRoutes',
        'data.routesYouMayLike',
      ],
      (
        [
          routes,
          routesWithRidesRemaining,
          backedCrowdstartRoutes,
          recentRoutes,
          liteRoutes,
          subscribedLiteRoutes,
          crowdstartRoutes,
          routesYouMayLike,
        ]
      ) => {
        // true iff some route has been loaded and is non-empty OR
        // all routes have been loaded and all are empty

        // Your routes
        if ($ionicHistory.currentStateName() === 'tabs.youRoutes') {
          $scope.data.routesAvailable =
            (routesWithRidesRemaining && routesWithRidesRemaining.length > 0) ||
            (recentRoutes && recentRoutes.length > 0) ||
            (subscribedLiteRoutes && subscribedLiteRoutes.length > 0) ||
            (backedCrowdstartRoutes && backedCrowdstartRoutes.length > 0) ||
            (routesYouMayLike && routesYouMayLike.length > 0) ||
            (routesWithRidesRemaining &&
              recentRoutes &&
              subscribedLiteRoutes &&
              backedCrowdstartRoutes &&
              routesYouMayLike)
        } else {
          $scope.data.routesAvailable =
            (routes && routes.length > 0) ||
            (liteRoutes && liteRoutes.length > 0) ||
            (crowdstartRoutes && crowdstartRoutes.length > 0) ||
            (routes && liteRoutes && crowdstartRoutes)
        }
      }
    )

    const routesAreLoaded = function routesAreLoaded () {
      return !!(
        $scope.data.routes &&
        $scope.data.liteRoutes &&
        $scope.data.crowdstartRoutes
      )
    }

    // call $anchorScroll only if all data loaded and there is $location.hash()
    $scope.$watch(
      () => routesAreLoaded(),
      loaded => {
        if (loaded && $location.hash()) {
          $timeout(() => {
            $anchorScroll()
          }, 0)
        }
      }
    )

    // Add expiry to routes
    $scope.$watchGroup(
      [
        () => RoutesService.getRoutePassTags(),
        () => RoutesService.getRoutePassExpiries(),
        'data.routes',
        'data.routesWithRidesRemaining',
        'data.recentRoutes',
        'data.routesYouMayLike',
      ],
      (
        [
          routePassTags,
          routePassExpiries,
          routes,
          routesWithRidesRemaining,
          recentRoutes,
          routesYouMayLike,
        ]
      ) => {
        // Input validation
        if (
          !routePassTags ||
          !routePassExpiries ||
          !routes ||
          !routesWithRidesRemaining ||
          !recentRoutes ||
          !routesYouMayLike
        ) {
          return
        }

        let [
          routesExp,
          routesWithRidesRemainingExp,
          recentRoutesExp,
          routesYouMayLikeExp,
        ] = [
          routes,
          routesWithRidesRemaining,
          recentRoutes,
          routesYouMayLike,
        ].map(routes => {
          return routes.map(route => {
            return addExpiryToRoute(route, routePassTags, routePassExpiries)
          })
        })

        if (!_.isEqual(routes, routesExp)) {
          $scope.data.routes = routesExp
        }
        if (!_.isEqual(routesWithRidesRemaining, routesWithRidesRemainingExp)) {
          $scope.data.routesWithRidesRemaining = routesWithRidesRemainingExp
        }
        if (!_.isEqual(recentRoutes, recentRoutesExp)) {
          $scope.data.recentRoutes = recentRoutesExp
        }
        if (!_.isEqual(routesYouMayLike, routesYouMayLikeExp)) {
          $scope.data.routesYouMayLike = routesYouMayLikeExp
        }
      }
    )

    // Reset disp.xxx when search terms have changed
    $scope.$watchGroup(
      [
        'data.placeQuery',
        'data.pickUpLocation',
        'data.dropOffLocation',
        'disp.searchFromTo',
      ],
      (
        [
          placeQuery,
          pickUpLocation,
          dropOffLocation,
          searchFromTo,
        ]
      ) => {
        $scope.disp.routes = _.clone($scope.data.routes)
        $scope.disp.liteRoutes = _.clone($scope.data.liteRoutes)
        $scope.disp.crowdstartRoutes = _.clone($scope.data.crowdstartRoutes)
        $scope.disp.routesWithRidesRemaining = _.clone($scope.data.routesWithRidesRemaining)
      }
    )

    // Text search
    $scope.$watchGroup(
      [
        'disp.routes',
        'disp.liteRoutes',
        'disp.crowdstartRoutes',
        'disp.routesWithRidesRemaining',
      ],
      (
        [
          routes,
          liteRoutes,
          crowdstartRoutes,
          routesWithRidesRemaining,
        ]
      ) => {
        let placeQuery = $scope.data.placeQuery
        if ($scope.disp.searchFromTo || !placeQuery || !routes || !liteRoutes || !crowdstartRoutes || !routesWithRidesRemaining) return

        let [
          fRoutes,
          fLiteRoutes,
          fCrowdstartRoutes,
          fRoutesWithRidesRemaining,
        ] = [
          routes,
          liteRoutes,
          crowdstartRoutes,
          routesWithRidesRemaining,
        ].map(routes => {
          // Filtering
          if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
            routes = SearchService.filterRoutesByPlaceAndText(
              routes,
              placeQuery,
              placeQuery.queryText
            )
          } else if (placeQuery && placeQuery.queryText) {
            routes = SearchService.filterRoutesByText(
              routes,
              placeQuery.queryText
            )
          }
          return routes
        })

        if (!_.isEqual(routes, fRoutes)) {
          $scope.disp.routes = fRoutes
        }
        if (!_.isEqual(liteRoutes, fLiteRoutes)) {
          $scope.disp.liteRoutes = fLiteRoutes
        }
        if (!_.isEqual(crowdstartRoutes, fCrowdstartRoutes)) {
          $scope.disp.crowdstartRoutes = fCrowdstartRoutes
        }
        if (!_.isEqual(routesWithRidesRemaining, fRoutesWithRidesRemaining)) {
          $scope.disp.routesWithRidesRemaining = fRoutesWithRidesRemaining
        }
      }
    )

    // From-to search
    $scope.$watchGroup(
      [
        'disp.routes',
        'disp.liteRoutes',
        'disp.crowdstartRoutes',
        'disp.routesWithRidesRemaining',
      ],
      (
        [
          routes,
          liteRoutes,
          crowdstartRoutes,
          routesWithRidesRemaining,
        ]
      ) => {
        let pickUpLocation = $scope.data.pickUpLocation
        let dropOffLocation = $scope.data.dropOffLocation
        if (!$scope.disp.searchFromTo || (!pickUpLocation && !dropOffLocation) || !routes || !liteRoutes || !crowdstartRoutes || !routesWithRidesRemaining) return

        let maxDistance = 750
        let pickUpLngLat = pickUpLocation ? [
          parseFloat(pickUpLocation.LONGITUDE),
          parseFloat(pickUpLocation.LATITUDE),
        ] : null
        let dropOffLngLat = dropOffLocation ? [
          parseFloat(dropOffLocation.LONGITUDE),
          parseFloat(dropOffLocation.LATITUDE),
        ] : null

        const filterRoutes = routes => {
          if (pickUpLocation) {
            routes = SearchService.filterRoutesByLngLatAndType(routes, pickUpLngLat, 'board', maxDistance)
          }
          if (dropOffLocation) {
            routes = SearchService.filterRoutesByLngLatAndType(routes, dropOffLngLat, 'alight', maxDistance)
          }
          return routes
        }

        let [
          fRoutes,
          fLiteRoutes,
          fCrowdstartRoutes,
          fRoutesWithRidesRemaining,
        ] = [
          routes,
          liteRoutes,
          crowdstartRoutes,
          routesWithRidesRemaining,
        ].map(filterRoutes)

        if (!_.isEqual(routes, fRoutes)) {
          $scope.disp.routes = fRoutes
        }
        if (!_.isEqual(liteRoutes, fLiteRoutes)) {
          $scope.disp.liteRoutes = fLiteRoutes
        }
        if (!_.isEqual(crowdstartRoutes, fCrowdstartRoutes)) {
          $scope.disp.crowdstartRoutes = fCrowdstartRoutes
        }
        if (!_.isEqual(routesWithRidesRemaining, fRoutesWithRidesRemaining)) {
          $scope.disp.routesWithRidesRemaining = fRoutesWithRidesRemaining
        }
      }
    )

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    // Manually pull the newest data from the server
    // Report any errors that happen
    // Note that theres no need to update the scope manually
    // since this is done by the service watchers
    $scope.refreshRoutes = function (ignoreCache) {
      RoutesService.fetchRoutePasses(ignoreCache)
      RoutesService.fetchRoutes(ignoreCache)
      const routesPromise = RoutesService.fetchRoutesWithRoutePass()
      const recentRoutesPromise = RoutesService.fetchRecentRoutes(ignoreCache)
      const allLiteRoutesPromise = LiteRoutesService.fetchLiteRoutes(
        ignoreCache
      )
      const crowdstartRoutesPromise = CrowdstartService.fetchCrowdstart(
        ignoreCache
      )
      const liteRouteSubscriptionsPromise = LiteRouteSubscriptionService.getSubscriptions(
        ignoreCache
      )
      const bidsPromise = CrowdstartService.fetchBids(ignoreCache)
      return $q
        .all([
          routesPromise,
          recentRoutesPromise,
          allLiteRoutesPromise,
          liteRouteSubscriptionsPromise,
          crowdstartRoutesPromise,
          bidsPromise,
        ])
        .then(() => {
          $scope.error = null
        })
        .catch(() => {
          $scope.error = true
        })
        .then(() => {
          $scope.$broadcast('scroll.refreshComplete')
        })
    }

    $scope.hasPersonalRoutes = function () {
      return !(
        $scope.data.routesWithRidesRemaining &&
        $scope.data.routesWithRidesRemaining.length === 0 &&
        $scope.data.recentRoutes &&
        $scope.data.recentRoutes.length === 0 &&
        $scope.data.subscribedLiteRoutes &&
        $scope.data.subscribedLiteRoutes.length === 0 &&
        $scope.data.backedCrowdstartRoutes &&
        $scope.data.backedCrowdstartRoutes.length === 0 &&
        $scope.data.routesYouMayLike &&
        $scope.data.routesYouMayLike.length === 0
      )
    }

    $scope.openSuggestionLink = function (event) {
      event.preventDefault()
      let appName = $rootScope.o.APP.NAME.replace(/\s/g, '')
      window.open(
        'https://www.beeline.sg/suggest.html#' +
          querystring.stringify({ referrer: appName }),
        '_system'
      )
    }

    $scope.toggleSearch = function () {
      $scope.disp.searchFromTo = !$scope.disp.searchFromTo
    }

    $scope.swapFromTo = function () {
      $scope.disp.animate = !$scope.disp.animate;

      [$scope.data.pickUpLocation, $scope.data.dropOffLocation] = [$scope.data.dropOffLocation, $scope.data.pickUpLocation]

      $scope.data.isFiltering = true
      $timeout(() => {
        $scope.data.isFiltering = false
      }, 1000)
    }
  },
]
