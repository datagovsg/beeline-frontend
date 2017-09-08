export default [
  '$scope',
  'MapOptions',
  'SharedVariableService',
  '$rootScope',
  function($scope, MapOptions, SharedVariableService, $rootScope) {
    $scope.map = MapOptions.defaultMapOptions({
      lines: {
        route: { path: [] },
        actualPath: { path: [] },
      },
      busLocation: {
        coordinates: null,
        icon: null,
      },
      markers: {
        boardStop: {},
        alightStop: {},
      }
    })

    $scope.$watch(()=>_.get($scope.map, 'control.getGMap()'), (googleMaps) => {
      if (googleMaps) {
        $scope.map.busLocation.icon = {
          url: `img/busMarker.svg`,
          scaledSize: new googleMaps.Size(68, 86),
          anchor: new googleMaps.Point(34, 78),
        }
      }
    })

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
      actualPath: [],
      alightStop: null,
      boardStop: null,
    }

    $scope.mapObject = _.assign({}, originalMapObject)

    // TODO: all map drawing need to be synced up , or once center is shifted, map is messed up
    $scope.$watch(() => SharedVariableService.get(), (data) => {
      $scope.mapObject = _.assign($scope.mapObject, data)
      MapOptions.disableMapLinks()
    }, true)

    // to reset the map
    $rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) => {
      // when transit from route-detail to route-stops, we don't want to reset the map
      if (toState && toState.data && toState.data.keepMapObject) {
        return;
      }
      $scope.stops = $scope.routePath = $scope.boardStops = $scope.alightStops = []
      $scope.mapObject = _.assign({}, originalMapObject)
      // TODO: re-fitBounds to center of Singapore
    })
  }
];
