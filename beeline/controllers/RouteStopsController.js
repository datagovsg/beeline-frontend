export default [
  '$scope',
  '$stateParams',
  '$ionicHistory',
  '$ionicLoading',
  '$ionicPopup',
  '$ionicScrollDelegate',
  'RoutesService',
  'BookingService',
  'MapService',
  function(
    $scope,
    $stateParams,
    $ionicHistory,
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
    // let routeId = $scope.$parent.routeId
    let type = $stateParams.type
    let stopId = $stateParams.stopId ? Number($stateParams.stopId) : null
    let callback = $stateParams.callback
    // ------------------------------------------------------------------------
    // Model
    // ------------------------------------------------------------------------
    $scope.data = {
      stops: null, // array of stop objects
      selectedStop: null, // stop object
    }
    // ------------------------------------------------------------------------
    // Hooks
    // ------------------------------------------------------------------------
    $scope.selectStop = (stop) => {
      $scope.data.selectedStop = stop
    }
    $scope.done = () => {
      if (typeof callback === 'function') callback($scope.data.selectedStop)
      $ionicHistory.goBack()
    }
    // ------------------------------------------------------------------------
    // Initialization
    // ------------------------------------------------------------------------
    $ionicLoading.show({
      template: `<ion-spinner icon='crescent'></ion-spinner><br/><small>Loading stop information</small>`,
      hideOnStateChange: true,
    })
    RoutesService.getRoute(routeId).then((route) => {
      // Load the stops data into the view
      let [pickups, dropoffs] = BookingService.computeStops(route.trips)
      if (type === 'pickup') $scope.data.stops = pickups
      if (type === 'dropoff') $scope.data.stops = dropoffs
      if (stopId) {
        $scope.data.selectedStop = $scope.data.stops.find(
          (stop) => stop.id === stopId
        )
      }
      // Scroll to the selected stop if we have one
      $ionicScrollDelegate.resize()
      $ionicLoading.hide()
    }).catch((error) => {
      // On error close out
      $ionicLoading.hide()
      $ionicPopup.alert({
        title: 'Sorry there\'s been a problem loading the stop information',
        subTitle: error,
      })
    })

    $scope.$watch('data.selectedStop', (stop) => {
      if (stop) {
        if (type === 'pickup') MapService.emit('board-stop-selected', {stop: stop})
        if (type === 'dropoff') MapService.emit('alight-stop-selected', {stop: stop})
      }
    })
  },
]
