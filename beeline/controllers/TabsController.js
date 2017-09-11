export default [
  '$scope',
  'MapOptions',
  'SharedVariableService',
  '$rootScope',
  'uiGmapGoogleMapApi',
  function($scope, MapOptions, SharedVariableService, $rootScope, uiGmapGoogleMapApi) {
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

    // Resolved when the map is initialized
    var gmapIsReady = new Promise((resolve, reject) => {
      var resolved = false;
      $scope.$watch('map.control.getGMap', function() {
        if ($scope.map.control.getGMap) {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        }
      });
    });


    gmapIsReady.then(() => {
      $scope.$watch( () => $scope.map.control.getGMap().getZoom(), (zoomLevel) => {
        if (zoomLevel > 12) {
          // TODO: fix if user zoom in
          $scope.map.control.getGMap().setZoom(12)
          MapOptions.resizePreserveCenter($scope.map.control.getGMap());
        }
      })
      MapOptions.disableMapLinks();
    })

    uiGmapGoogleMapApi.then((googleMaps) => {
      $scope.map.busLocation.icon = {
        url: `img/busMarker.svg`,
        scaledSize: new googleMaps.Size(68, 86),
        anchor: new googleMaps.Point(34, 78),
      }
    })

    $scope.$watch('mapObject.stops', (stops) => {
      if (stops && stops.length > 0) {
        var bounds = MapOptions.formBounds(stops);
        var newCenter = bounds.getCenter()
        $scope.map.control.getGMap().setCenter(bounds.getCenter());
        $scope.map.control.getGMap().fitBounds(bounds)
        // $scope.map.control.getGMap().setZoom(13);
        // google.maps.event.trigger($scope.map.control.getGMap(), 'resize');
        //MapOptions.resizePreserveCenter($scope.map.control.getGMap());
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
    }, true)

    // to reset the map
    $rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) => {
      // when transit from route-detail to route-stops, we don't want to reset the map
      // similarly when transit from route-stops to route-detail, we retain the map
      if (toState && toState.data && toState.data.keepMapObject || fromState && fromState.data && fromState.data.keepMapObject) {
        return;
      }
      $scope.stops = $scope.routePath = $scope.boardStops = $scope.alightStops = []
      $scope.mapObject = _.assign({}, originalMapObject)
      // TODO: re-fitBounds to center of Singapore
       $scope.map.control.getGMap().setCenter({
         lat: 1.38,
         lng: 103.8,
       });
    })
  }
];
