export default [
  '$scope',
  'SharedVariableService',
  '$stateParams',
  'BookingService',
  'RoutesService',
  'MapService',
  'MapViewFactory',
  function (
    $scope,
    SharedVariableService,
    $stateParams,
    BookingService,
    RoutesService,
    MapService,
    MapViewFactory
  ) {
    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let routeId = $stateParams.routeId ? Number($stateParams.routeId) : null

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    MapViewFactory.init($scope)

    // ------------------------------------------------------------------------
    // Data Loading
    // ------------------------------------------------------------------------
    if (routeId) {
      RoutesService.getRoute(routeId).then(response => {
        const route = response
        // Grab the stop data
        let [pickups, dropoffs] = BookingService.getStopsFromTrips(route.trips)
        const stops = pickups.concat(dropoffs)
        SharedVariableService.setStops(stops)
        $scope.mapObject.stops = stops
        if (route.path) {
          RoutesService.decodeRoutePath(route.path)
            .then(decodedPath => {
              $scope.mapObject.routePath = decodedPath
            })
            .catch(() => {
              $scope.mapObject.routePath = []
            })
        }
      })
    }

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    MapService.on('board-stop-selected', stop => {
      $scope.mapObject.boardStop = stop
      SharedVariableService.setBoardStop(stop)
    })

    MapService.on('alight-stop-selected', stop => {
      $scope.mapObject.alightStop = stop
      SharedVariableService.setAlightStop(stop)
    })

    MapService.on('stop-selected', stop => {
      $scope.mapObject.chosenStop = stop
      SharedVariableService.setChosenStop(stop)
    })

    MapService.on('draw-curved-path', route => {
      $scope.mapObject.curvedPath = route
    })
  },
]
