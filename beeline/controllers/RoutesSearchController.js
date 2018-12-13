
export default [
  '$q',
  '$scope',
  '$state',
  '$timeout',
  '$ionicLoading',
  'MapService',
  'RoutesService',
  'LiteRoutesService',
  'CrowdstartService',
  'LiteRouteSubscriptionService',
  'GoogleAnalytics',
  function (
    // Angular Tools
    $q,
    $scope,
    $state,
    $timeout,
    $ionicLoading,
    MapService,
    RoutesService,
    LiteRoutesService,
    CrowdstartService,
    LiteRouteSubscriptionService,
    GoogleAnalytics
  ) {
    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------
    const updateMapStops = function updateMapStops (stopType) {
      return (loc) => {
        if (loc) {
          const stop = {
            coordinates: {
              type: 'Point',
              coordinates: [
                parseFloat(loc.LONGITUDE),
                parseFloat(loc.LATITUDE),
              ],
            },
          }
          MapService.emit(stopType, { stop: stop })
        } else {
          MapService.emit(stopType, null)
        }
      }
    }

    const updateMapCurvedPath = function updateMapCurvedPath ([board, alight]) {
      if (!board || !alight) {
        MapService.emit('draw-curved-path', null)
      } else {
        MapService.emit('draw-curved-path', {
          board: {
            lat: parseFloat(board.LATITUDE),
            lng: parseFloat(board.LONGITUDE),
          },
          alight: {
            lat: parseFloat(alight.LATITUDE),
            lng: parseFloat(alight.LONGITUDE),
          },
        })
      }
    }

    const redrawMapElements = function redrawMapElements () {
      updateMapStops('board-stop-selected')($scope.data.pickUpLocation)
      updateMapStops('alight-stop-selected')($scope.data.dropOffLocation)
      updateMapCurvedPath([$scope.data.pickUpLocation, $scope.data.dropOffLocation])
    }

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.data = {
      pickUpLocation: null,
      dropOffLocation: null,
    }

    // ------------------------------------------------------------------------
    // Ionic events
    // ------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
      // Refresh routes on enter for routes in case we did something that
      // changed my routes e.g. unsubscribing lite route, booking a route,
      // withdrawing from crowdstart
      $scope.refreshRoutes(true)
      redrawMapElements()
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch('data.pickUpLocation', updateMapStops('board-stop-selected'))

    $scope.$watch('data.dropOffLocation', updateMapStops('alight-stop-selected'))

    $scope.$watchGroup(
      ['data.pickUpLocation', 'data.dropOffLocation'],
      updateMapCurvedPath
    )

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.search = function () {
      let pickUp = $scope.data.pickUpLocation
      let dropOff = $scope.data.dropOffLocation

      // Send GA event
      let label = ''
      if (pickUp) {
        label += 'Pickup: ' + pickUp.SEARCHVAL + dropOff ? ' | ' : ''
      }
      if (dropOff) {
        label += 'Dropoff: ' + dropOff.SEARCHVAL
      }
      GoogleAnalytics.send('send', 'event', {
        eventCategory: 'search',
        eventAction: 'search button',
        eventLabel: label,
      })

      $ionicLoading.show({
        template: `<ion-spinner icon='crescent'></ion-spinner><br/><small>Searching for routes</small>`,
      })

      $timeout(() => {
        $ionicLoading.hide()
        $state.go('tabs.routes-search-list', {
          pickUpLocation: pickUp,
          dropOffLocation: dropOff,
        })
      }, 800)
    }

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
  },
]
