import {SafeInterval} from '../SafeInterval';
export default [
  '$scope',
  'MapOptions',
  'SharedVariableService',
  '$rootScope',
  'uiGmapGoogleMapApi',
  '$timeout',
  'TripService',
  function($scope, MapOptions, SharedVariableService, $rootScope,
    uiGmapGoogleMapApi, $timeout, TripService) {
    $scope.map = MapOptions.defaultMapOptions({
      busLocation: {
        coordinates: null,
        icon: null,
      }
    })

    $scope.disp = {
      popupStop: null,
    }

    $scope.closeWindow = function () {
      $scope.disp.popupStop = null;
      $scope.digest()
    }

    $scope.applyTapBoard = function (stop) {
      $scope.disp.popupStop = stop;
      $scope.digest()
    }

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
        // if (zoomLevel > 12) {
        //   // TODO: fix if user zoom in
        //   $scope.map.control.getGMap().setZoom(12)
        //   MapOptions.resizePreserveCenter($scope.map.control.getGMap());
        // }
        console.log('zoom level is '+zoomLevel)
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
        // var newCenter = bounds.getCenter()
        // TODO: center the map properly
        // $scope.map.control.getGMap().setCenter(newCenter);
        gmapIsReady.then(() => {
          var gmap = $scope.map.control.getGMap()
          google.maps.event.trigger(gmap, 'resize')
          gmap.fitBounds(bounds)
        })
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
    }

    $scope.mapObject = _.assign({}, originalMapObject)

    // TODO: all map drawing need to be synced up , or once center is shifted, map is messed up
    $scope.$watch(() => SharedVariableService.get(), (data) => {
      $scope.mapObject = _.assign($scope.mapObject, data)
    }, true)

    $scope.$watch('mapObject.chosenStop', (stop) => {
      if (stop) {
        gmapIsReady.then(() => {
          var gmap = $scope.map.control.getGMap()
          gmap.panTo({
            lat: stop.coordinates.coordinates[1],
            lng: stop.coordinates.coordinates[0],
          })
          gmap.setZoom(17);
        })
      }
    })

    // to reset the map
    $rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) => {
      // when transit from route-detail to route-stops, we don't want to reset the map
      // similarly when transit from route-stops to route-detail, we retain the map
      if (toState && toState.data && toState.data.keepMapObject || fromState && fromState.data && fromState.data.keepMapObject) {
        return;
      }
      $scope.mapObject = _.assign({}, originalMapObject)
      // TODO: re-fitBounds to center of Singapore
       $scope.map.control.getGMap().setCenter({
         lat: 1.38,
         lng: 103.8,
       });
    })

    //fetch driver pings every 4s
    $scope.timeout = new SafeInterval(pingLoop, 4000, 1000);

    $scope.$on("killPingLoop", () => {
      $scope.timeout.stop();
    });

    $scope.$on("startPingLoop", () => {
      $scope.timeout.start();
    });

    //load icons and path earlier by restart timeout on watching trips
    $scope.$watchCollection('mapObject.pingTrips', () => {
      $scope.timeout.stop();
      $scope.timeout.start();
    });

    async function pingLoop() {
      if (!$scope.mapObject.pingTrips) return;

      $scope.mapObject.statusMessages = $scope.mapObject.statusMessages || []
      $scope.mapObject.allRecentPings = $scope.mapObject.allRecentPings || []

      $scope.mapObject.statusMessages.length = $scope.mapObject.allRecentPings.length = $scope.mapObject.pingTrips.length

      await Promise.all($scope.mapObject.pingTrips.map((trip, index) => {
        return TripService.DriverPings(trip.id)
        .then((info) => {
          const now = Date.now()

          $scope.mapObject.allRecentPings[index] = {
            ...info,
            isRecent: info.pings[0] &&
              (now - info.pings[0].time.getTime()) < 5 * 60000,
          }

          $scope.mapObject.statusMessages[index] = _.get(info, 'statuses[0].message', null)
        })
      }))
      //to mark no tracking data if no ping or pings are too old
      if (_.every($scope.mapObject.allRecentPings,{"isRecent": undefined})) {
        $scope.hasTrackingData = false;
      } else {
        $scope.hasTrackingData = true;
      }
    }

    // TODO: need to watch on GMap size e.g. switch from desktop to mobile
  }
];
