import _ from 'lodash'

export default [
  '$scope',
  'SharedVariableService',
  '$stateParams',
  'RoutesService',
  'MapService',
  'LiteRoutesService',
  'MapViewFactory',
  function (
    $scope,
    SharedVariableService,
    $stateParams,
    RoutesService,
    MapService,
    LiteRoutesService,
    MapViewFactory
  ) {
    // ------------------------------------------------------------------------
    // Helper functions
    // ------------------------------------------------------------------------
    /**
     * Request driver pings for the given trip
     */
    const pingLoop = async function pingLoop () {
      const recentTimeBound = 5 * 60000
      await MapViewFactory.pingLoop($scope, recentTimeBound)()

      // to mark no tracking data if no ping or pings are too old
      // isRecent could be undefined(no pings) or false (pings are out-dated)
      $scope.hasTrackingData = _.any(
        $scope.mapObject.allRecentPings,
        'isRecent'
      )
      let tripInfo = {
        hasTrackingData: $scope.hasTrackingData,
        statusMessages: $scope.mapObject.statusMessages.join(' '),
      }

      MapService.emit('tripInfo', tripInfo)
    }

    const statusLoop = MapViewFactory.statusLoop($scope)

    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    MapViewFactory.init($scope)
    MapViewFactory.setupPingLoops($scope, pingLoop, statusLoop)

    // ------------------------------------------------------------------------
    // Data Loading
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    MapService.on('stop-selected', stop => {
      $scope.mapObject.chosenStop = stop
      SharedVariableService.setChosenStop(stop)
    })

    MapService.once('lite-route-loaded', route => {
      if (route.path) {
        RoutesService.decodeRoutePath(route.path)
          .then(decodedPath => {
            $scope.mapObject.routePath = decodedPath
          })
          .catch(() => {
            $scope.mapObject.routePath = []
          })
      }
      $scope.mapObject.stops = route.stops
      SharedVariableService.setStops(route.stops)
    })
  },
]
