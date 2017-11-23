import _ from 'lodash'

export default [
  '$scope',
  'MapOptions',
  'SharedVariableService',
  'uiGmapGoogleMapApi',
  function($scope, MapOptions, SharedVariableService, uiGmapGoogleMapApi) {
    $scope.map = MapOptions.defaultMapOptions({
      busLocation: {
        coordinates: null,
        icon: null,
      },
    })

    $scope.disp = {
      popupStop: null,
      routeMessage: null,
    }

    // Resolved when the map is initialized
    var gmapIsReady = new Promise((resolve, reject) => {
      var resolved = false
      $scope.$watch('map.control.getGMap', function() {
        if ($scope.map.control.getGMap) {
          if (!resolved) {
            resolved = true
            resolve()
          }
        }
      })
    })

    gmapIsReady.then(() => {
      MapOptions.disableMapLinks()
    })

    uiGmapGoogleMapApi.then(googleMaps => {
      $scope.map.busLocation.icon = {
        url: `img/busMarker.svg`,
        scaledSize: new googleMaps.Size(68, 86),
        anchor: new googleMaps.Point(34, 78),
      }
    })

    $scope.$watch('mapObject.stops', stops => {
      if (stops && stops.length > 0) {
        var bounds = MapOptions.formBounds(stops)
        if ($scope.map.control.getGMap) {
          var gmap = $scope.map.control.getGMap()
          google.maps.event.trigger(gmap, 'resize')
          gmap.fitBounds(bounds)
        }
      }
    })

    var originalMapObject = {
      stops: [],
      routePath: [],
      alightStop: null,
      boardStop: null,
      pingTrips: [],
      allRecentPings: [],
      chosenStop: null,
      statusMessages: [],
    }

    $scope.mapObject = _.assign({}, originalMapObject)

    $scope.$watch(() => SharedVariableService.get(), data => {
      $scope.mapObject = _.assign($scope.mapObject, data)
    }, true)

    function panToStop(stop, setZoom) {
      if ($scope.map.control.getGMap) {
        var gmap = $scope.map.control.getGMap()
        gmap.panTo({
          lat: stop.coordinates.coordinates[1],
          lng: stop.coordinates.coordinates[0],
        })
        if (setZoom) {
          gmap.setZoom(17)
        }
      }
    }

    $scope.$watch('mapObject.chosenStop', stop => {
      if (stop) {
        panToStop(stop, true)
      }
    })

    $scope.$watch('mapObject.boardStop', stop => {
      if (stop) {
        panToStop(stop.stop)
      }
    })

    $scope.$watch('mapObject.alightStop', stop => {
      if (stop) {
        panToStop(stop.stop)
      }
    })
  },
]
