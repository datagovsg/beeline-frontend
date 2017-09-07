export default [
  '$scope',
  'MapOptions',
  'SharedVariableService',
  '$rootScope',
  function($scope, MapOptions, SharedVariableService, $rootScope) {
    $scope.map = MapOptions.defaultMapOptions();

    $scope.$watch('mapObject.stops', (stops) => {
      if (stops && stops.length > 0) {
        var bounds = MapOptions.formBounds(stops);
        $scope.map.control.getGMap().fitBounds(bounds)
      }
    })

    var originalMapObject = {
      stops: [],
      routePath: [],
      boardStops: [],
      alightStops: [],
    }

    $scope.mapObject = _.assign({}, originalMapObject)

    $scope.$watch(() => SharedVariableService.get(), (data) => {
      $scope.mapObject = _.assign($scope.mapObject, data)
    }, true)

    // to reset the map
    $rootScope.$on('$stateChangeStart', (evt, state) => {
      $scope.stops = $scope.routePath = $scope.boardStops = $scope.alightStops = []
      $scope.mapObject = _.assign({}, originalMapObject)
      // TODO: re-fitBounds to center of Singapore
    })
  }
];
