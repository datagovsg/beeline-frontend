import _ from 'lodash'
import moment from 'moment-timezone'

export default [
  '$scope',
  '$q',
  '$state',
  'RoutesService',
  'CrowdstartService',
  'LiteRoutesService',
  'LiteRouteSubscriptionService',
  '$ionicHistory',
  function (
    // Angular Tools
    $scope,
    $q,
    $state,
    // Route Information
    RoutesService,
    CrowdstartService,
    LiteRoutesService,
    // Misc
    LiteRouteSubscriptionService,
    $ionicHistory
  ) {
    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------
    const addExpiryToRoute = function addExpiryToRoute (
      route,
      routePassExpiries
    ) {
      // Create a map of the route's tags into corresponding expiry dates
      let expiries = {}
      const scopedTags = _.intersection(route.tags, _.keys(routePassExpiries))
      // If there are no tags to map, return the route as-is
      if (scopedTags.length === 0) {
        return route
      }

      for (let tag of scopedTags) {
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
      // Different types of route data
      routesWithRidesRemaining: null,
      backedCrowdstartRoutes: null,
      recentRoutes: null,
      recentRoutesById: null,
      subscribedLiteRoutes: null,
      routesAvailable: false,
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
    // Recent routes
    // Need to pull in the "full" data from all routes
    $scope.$watch(
      () => RoutesService.getRecentRoutes(),
      async recentRoutes => {
        // If we cant find route data here then proceed with empty
        // This allows it to organically "clear" any state
        if (!recentRoutes) return

        // "Fill in" the recent routes with the all routes data
        $scope.data.recentRoutes = recentRoutes
          .filter(route => route && route.id !== undefined)

        for (const route of $scope.data.recentRoutes) {
          const routeWithTrip = await RoutesService.getRoute(route.id, true)
          route.trips = routeWithTrip.trips
        }
        $scope.data.recentRoutesById = _.keyBy($scope.data.recentRoutes, 'id')
      }
    )

    // Crowdstarted routes
    $scope.$watchGroup(
      [
        'data.recentRoutesById',
        () => RoutesService.getRoutePasses(),
      ],
      async ([recentRoutesById, ridesRemainingMap]) => {
        // Input validation
        if (!recentRoutesById || !ridesRemainingMap) return

        Object.values(recentRoutesById).forEach(route => {
          route.ridesRemaining = 0
          route.tags.forEach(tag => {
            route.ridesRemaining += (ridesRemainingMap[tag] || 0)
          })
        })

        const routesWithRidesRemainingPromises = Object.keys(ridesRemainingMap)
          .map(tag => RoutesService.fetchRoutes(true, { tags: JSON.stringify([ tag ]) }))

        const routesWithRidesRemaining = _(await Promise.all(routesWithRidesRemainingPromises))
          .flatten()
          .uniqBy('id')
          .value()

        routesWithRidesRemaining.forEach(route => {
          route.ridesRemaining = 0
          route.tags.forEach(tag => {
            route.ridesRemaining += (ridesRemainingMap[tag] || 0)
          })
        })
        const recentRouteIds = Object.keys(recentRoutesById || {})
        $scope.data.routesWithRidesRemaining = routesWithRidesRemaining.filter(
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
        'data.routesWithRidesRemaining',
        'data.backedCrowdstartRoutes',
        'data.recentRoutes',
        'data.subscribedLiteRoutes',
      ],
      (
        [
          routesWithRidesRemaining,
          backedCrowdstartRoutes,
          recentRoutes,
          subscribedLiteRoutes,
        ]
      ) => {
        // true iff some route has been loaded and is non-empty OR
        // all routes have been loaded and all are empty
        $scope.data.routesAvailable =
          (routesWithRidesRemaining && routesWithRidesRemaining.length > 0) ||
          (recentRoutes && recentRoutes.length > 0) ||
          (subscribedLiteRoutes && subscribedLiteRoutes.length > 0) ||
          (backedCrowdstartRoutes && backedCrowdstartRoutes.length > 0) ||
          (routesWithRidesRemaining &&
            recentRoutes &&
            subscribedLiteRoutes &&
            backedCrowdstartRoutes)
      }
    )

    // Add expiry to routes
    $scope.$watchGroup(
      [
        () => RoutesService.getRoutePassExpiries(),
        'data.routesWithRidesRemaining',
        'data.recentRoutes',
      ],
      (
        [
          routePassExpiries,
          routesWithRidesRemaining,
          recentRoutes,
        ]
      ) => {
        // Input validation
        if (
          !routePassExpiries ||
          !routesWithRidesRemaining ||
          !recentRoutes
        ) {
          return
        }

        let [
          routesWithRidesRemainingExp,
          recentRoutesExp,
        ] = [
          routesWithRidesRemaining,
          recentRoutes,
        ].map(routes => {
          return routes.map(route => {
            return addExpiryToRoute(route, routePassExpiries)
          })
        })

        if (!_.isEqual(routesWithRidesRemaining, routesWithRidesRemainingExp)) {
          $scope.data.routesWithRidesRemaining = routesWithRidesRemainingExp
        }
        if (!_.isEqual(recentRoutes, recentRoutesExp)) {
          $scope.data.recentRoutes = recentRoutesExp
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
        $scope.data.backedCrowdstartRoutes.length === 0
      )
    }
  },
]
