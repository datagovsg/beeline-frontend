import _ from 'lodash'

export default [
  '$scope',
  '$ionicSideMenuDelegate',
  'MapUtilService',
  'SharedVariableService',
  'uiGmapGoogleMapApi',
  'UserService',
  '$state',
  'loadingSpinner',
  function (
    $scope,
    $ionicSideMenuDelegate,
    MapUtilService,
    SharedVariableService,
    uiGmapGoogleMapApi,
    UserService,
    $state,
    loadingSpinner
  ) {
    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------
    const panToStop = function panToStop (stop, setZoom) {
      if ($scope.map.control.getGMap) {
        const gmap = $scope.map.control.getGMap()
        gmap.panTo({
          lat: stop.coordinates.coordinates[1],
          lng: stop.coordinates.coordinates[0],
        })
        if (setZoom) {
          gmap.setZoom(15)
        }
      }
    }

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.map = MapUtilService.defaultMapOptions({
      busLocation: {
        coordinates: null,
        icon: null,
      },
    })

    $scope.disp = {
      popupStop: null,
      routeMessage: null,
      isLoggedIn: false,
    }

    // ------------------------------------------------------------------------
    // Data Loading
    // ------------------------------------------------------------------------
    // Resolved when the map is initialized
    const gmapIsReady = new Promise((resolve, reject) => {
      let resolved = false
      $scope.$watch('map.control.getGMap', function () {
        if ($scope.map.control.getGMap) {
          if (!resolved) {
            resolved = true
            resolve()
          }
        }
      })
    })

    gmapIsReady.then(() => {
      MapUtilService.disableMapLinks()
    })

    uiGmapGoogleMapApi.then(googleMaps => {
      $scope.map.busLocation.icon = {
        url: `img/busMarker.svg`,
        scaledSize: new googleMaps.Size(68, 86),
        anchor: new googleMaps.Point(34, 78),
      }
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch(
      () => UserService.getUser(),
      user => {
        $scope.disp.isLoggedIn = user !== null
      }
    )

    $scope.$watch('mapObject.stops', stops => {
      if (stops && stops.length > 0) {
        const bounds = MapUtilService.formBounds(stops)
        if ($scope.map.control.getGMap) {
          const gmap = $scope.map.control.getGMap()
          google.maps.event.trigger(gmap, 'resize')
          gmap.fitBounds(bounds)
          let zoom = gmap.zoom > 11 ? 11 : gmap.zoom
          gmap.setZoom(zoom)
          google.maps.event.trigger(gmap, 'zoom_changed')
        }
      }
    })

    $scope.$watch(
      () => SharedVariableService.get(),
      data => {
        $scope.mapObject = _.assign($scope.mapObject, data)
      },
      true
    )

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

    // Watcher for side menu opening event
    // See https://forum.ionicframework.com/t/side-menu-event-listener/3793/7 for more details
    $scope.isMenuOpen = $ionicSideMenuDelegate.isOpen.bind(
      $ionicSideMenuDelegate
    )

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.login = UserService.promptLogIn
  },
]
