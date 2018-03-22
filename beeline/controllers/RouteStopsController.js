export default [
  "$scope",
  "$stateParams",
  "$timeout",
  "$ionicHistory",
  "$ionicLoading",
  "$ionicPopup",
  "$ionicScrollDelegate",
  "RoutesService",
  "BookingService",
  "MapService",
  function(
    $scope,
    $stateParams,
    $timeout,
    $ionicHistory,
    $ionicLoading,
    $ionicPopup,
    $ionicScrollDelegate,
    RoutesService,
    BookingService,
    MapService
  ) {
    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let routeId = $stateParams.routeId ? Number($stateParams.routeId) : null
    let type = $stateParams.type
    let stopId = $stateParams.stopId ? Number($stateParams.stopId) : null
    let callback = $stateParams.callback

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.data = {
      stops: null, // array of stop objects
      selectedStop: null, // stop object
      type, // used for nav-title
    }

    RoutesService.getRoute(routeId)
      .then(route => {
        // Load the stops data into the view
        let [pickups, dropoffs] = BookingService.getStopsFromTrips(route.trips)
        if (type === "pickup") $scope.data.stops = pickups
        if (type === "dropoff") $scope.data.stops = dropoffs
        if (stopId) {
          $scope.data.selectedStop = $scope.data.stops.find(
            stop => stop.id === stopId
          )
        }
        // Scroll to the selected stop if we have one
        $ionicScrollDelegate.resize()

        // Make animation slightly longer
        $timeout(() => {
          $ionicLoading.hide()
        }, 400)
      })
      .catch(error => {
        // On error close out
        $ionicLoading.hide()
        $ionicPopup.alert({
          title: "Sorry there's been a problem loading the stop information",
          subTitle: error,
        })
      })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch("data.selectedStop", stop => {
      if (stop) {
        if (type === "pickup") {
          MapService.emit("board-stop-selected", { stop: stop })
        }
        if (type === "dropoff") {
          MapService.emit("alight-stop-selected", { stop: stop })
        }
      }
    })

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $ionicLoading.show({
      template: `<ion-spinner icon='crescent'></ion-spinner>\
        <br/><small>Loading stop information</small>`,
    })

    $scope.selectStop = stop => {
      $scope.data.selectedStop = stop
    }
    $scope.done = () => {
      if (typeof callback === "function") callback($scope.data.selectedStop)
      $ionicHistory.goBack()
    }
  },
]
