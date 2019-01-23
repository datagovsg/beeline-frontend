import _ from 'lodash'

export default [
  '$scope',
  '$state',
  '$stateParams',
  'SearchService',
  'LiteRoutesService',
  'LiteRouteSubscriptionService',
  'RoutesService',
  'CrowdstartService',
  function (
    // Angular Tools
    $scope,
    $state,
    $stateParams,
    SearchService,
    LiteRoutesService,
    LiteRouteSubscriptionService,
    RoutesService,
    CrowdstartService
  ) {
    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------
    const filterBySearchTerms = function filterBySearchTerms (
      [
        pickUpLocation,
        dropOffLocation,
      ]
    ) {
      let routes = _.clone($scope.data.routes)
      let liteRoutes = _.clone($scope.data.liteRoutes)
      let crowdstartRoutes = _.clone($scope.data.crowdstartRoutes)

      if (!routes || !liteRoutes || !crowdstartRoutes) return

      let [
        fRoutes,
        fLiteRoutes,
        fCrowdstartRoutes,
      ] = [
        routes,
        liteRoutes,
        crowdstartRoutes,
      ].map(routes => {
        let pickUpLocation = $scope.data.pickUpLocation
        let dropOffLocation = $scope.data.dropOffLocation

        if (!pickUpLocation && !dropOffLocation) return routes

        let maxDistance = 750
        let pickUpLngLat = pickUpLocation ? [
          parseFloat(pickUpLocation.LONGITUDE),
          parseFloat(pickUpLocation.LATITUDE),
        ] : null
        let dropOffLngLat = dropOffLocation ? [
          parseFloat(dropOffLocation.LONGITUDE),
          parseFloat(dropOffLocation.LATITUDE),
        ] : null

        if (pickUpLocation && pickUpLocation.LONGITUDE && pickUpLocation.LATITUDE) {
          routes = SearchService.filterRoutesByLngLatAndType(routes, pickUpLngLat, 'board', maxDistance)
        }
        if (dropOffLocation && dropOffLocation.LONGITUDE && dropOffLocation.LATITUDE) {
          routes = SearchService.filterRoutesByLngLatAndType(routes, dropOffLngLat, 'alight', maxDistance)
        }
        return routes
      })

      $scope.disp.routes = fRoutes
      $scope.disp.liteRoutes = fLiteRoutes
      $scope.disp.crowdstartRoutes = fCrowdstartRoutes
    }

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.data = {
      pickUpLocation: $stateParams.pickUpLocation,
      dropOffLocation: $stateParams.dropOffLocation,
    }

    $scope.disp = {
      displaySuggestBtn: $stateParams.displaySuggestBtn,
    }

    // ------------------------------------------------------------------------
    // Ionic events
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
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

    // mix all the routes together
    $scope.$watchGroup(
      [
        'disp.routes',
        'disp.liteRoutes',
        'disp.crowdstartRoutes',
      ],
      ([routes, liteRoutes, crowdstartRoutes]) => {
        if (routes && liteRoutes && crowdstartRoutes) {
          // set id for lite routes so that we can publish unique routes
          // (see end of this function)
          liteRoutes.map(route => {
            route.id = route.routeIds
          })

          let allRoutes = _.concat(routes, liteRoutes, crowdstartRoutes)

          allRoutes = SearchService.sortRoutesBySearchQueries(
            allRoutes,
            $scope.data.pickUpLocation,
            $scope.data.dropOffLocation,
          )

          // publish unique routes
          $scope.data.mixedRoutes = _.uniqBy(allRoutes, 'id')
        }
      }
    )

    // Hides the animated loading routes
    $scope.$watchGroup(
      [
        'data.routes',
        'data.liteRoutes',
        'data.crowdstartRoutes',
      ],
      (
        [
          routes,
          liteRoutes,
          crowdstartRoutes,
        ]
      ) => {
        // true iff some route has been loaded and is non-empty OR
        // all routes have been loaded and all are empty
        $scope.data.routesAvailable =
          (routes && routes.length > 0) ||
          (liteRoutes && liteRoutes.length > 0) ||
          (crowdstartRoutes && crowdstartRoutes.length > 0) ||
          (routes && liteRoutes && crowdstartRoutes)
      }
    )

    $scope.$watchGroup(
      [
        'data.routes',
        'data.liteRoutes',
        'data.crowdstartRoutes',
      ],
      () => {
        filterBySearchTerms([
          $scope.data.pickUpLocation,
          $scope.data.dropOffLocation,
        ])
      }
    )

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
  },
]
