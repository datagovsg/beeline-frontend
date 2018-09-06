import _ from 'lodash'

export default [
  '$q',
  '$scope',
  '$state',
  '$ionicPopup',
  'loadingSpinner',
  'MapService',
  'RoutesService',
  'LiteRoutesService',
  'CrowdstartService',
  'LiteRouteSubscriptionService',
  'SuggestionService',
  'SharedVariableService',
  function (
    // Angular Tools
    $q,
    $scope,
    $state,
    $ionicPopup,
    loadingSpinner,
    MapService,
    RoutesService,
    LiteRoutesService,
    CrowdstartService,
    LiteRouteSubscriptionService,
    SuggestionService,
    SharedVariableService
  ) {
    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------

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
    // Reset all fields on leaving create-new-suggestion page
    // after creating a new suggestion
    $scope.$on('$ionicView.leave', function () {
      $scope.resetSuggestion()
    })

    $scope.$on('$ionicView.enter', function () {
      // Refresh routes on enter for routes in case we did something that
      // changed my routes e.g. unsubscribing lite route, booking a route,
      // withdrawing from crowdstart
      $scope.refreshRoutes(true)
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch('data.pickUpLocation', loc => {
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
        MapService.emit('board-stop-selected', { stop: stop })
      }
    })

    $scope.$watch('data.dropOffLocation', loc => {
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
        MapService.emit('alight-stop-selected', { stop: stop })
      }
    })

    $scope.$watchGroup(
      ['data.pickUpLocation', 'data.dropOffLocation'],
      ([board, alight]) => {
        if (!board || !alight) return
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
      })

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.resetSuggestion = function () {
      $scope.data.pickUpLocation = null
      $scope.data.dropOffLocation = null
    }

    $scope.swapFromTo = function () {
      [$scope.data.pickUpLocation, $scope.data.dropOffLocation] = [_.clone($scope.data.dropOffLocation), _.clone($scope.data.pickUpLocation)]
    }

    $scope.search = function () {
      let pickUp = $scope.data.pickUpLocation
      let dropOff = $scope.data.dropOffLocation
      $state.go('tabs.routes-search-list', {
        fromLat: pickUp ? pickUp.LATITUDE : null,
        fromLng: pickUp ? pickUp.LONGITUDE : null,
        toLat: dropOff ? dropOff.LATITUDE : null,
        toLng: dropOff ? dropOff.LONGITUDE : null,
      })
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
