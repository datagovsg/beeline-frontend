export default [
  "$scope",
  "$state",
  "$stateParams",
  "$ionicLoading",
  "$ionicPopup",
  "$ionicScrollDelegate",
  "RoutesService",
  "BookingService",
  "MapService",
  function(
    $scope,
    $state,
    $stateParams,
    $ionicLoading,
    $ionicPopup,
    $ionicScrollDelegate,
    RoutesService,
    BookingService,
    MapService
  ) {
    // ------------------------------------------------------------------------
    // Input
    // ------------------------------------------------------------------------
    let routeId = $stateParams.routeId ? Number($stateParams.routeId) : null
    // ------------------------------------------------------------------------
    // Model
    // ------------------------------------------------------------------------
    $scope.data = {
      selectedStop: null, // stop object
      boardStops: null,
      alightStops: null,
    }

    // ------------------------------------------------------------------------
    // Hooks
    // ------------------------------------------------------------------------
    $scope.selectStop = stop => {
      $scope.data.selectedStop = stop
      MapService.emit('stop-selected', stop)
    }
    $scope.done = () => {
      $state.go("tabs.crowdstart-detail", {
        routeId: routeId,
      })
    }

    // ------------------------------------------------------------------------
    // Initialization
    // ------------------------------------------------------------------------
    $ionicLoading.show({
      template: `<ion-spinner icon='crescent'></ion-spinner><br/><small>Loading stop information</small>`,
      hideOnStateChange: true,
    })
    RoutesService.getRoute(routeId).then(route => {
      // Load the stops data into the view
      let [pickups, dropoffs] = BookingService.computeStops(route.trips)
      // $scope.data.stops = pickups.concat(dropoffs)
      $scope.data.boardStops = pickups
      $scope.data.alightStops = dropoffs
      // Scroll to the selected stop if we have one
      $ionicScrollDelegate.resize()
      $ionicLoading.hide()
    }).catch(error => {
      // On error close out
      $ionicLoading.hide()
      $ionicPopup.alert({
        title: "Sorry there's been a problem loading the stop information",
        subTitle: error,
      })
    })
  },
]
