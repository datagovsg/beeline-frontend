export default [
  "$scope",
  "$state",
  "$stateParams",
  "$ionicHistory",
  "$ionicLoading",
  "$ionicPopup",
  "$ionicScrollDelegate",
  "RoutesService",
  "BookingService",
  "SharedVariableService",
  function(
    $scope,
    $state,
    $stateParams,
    $ionicHistory,
    $ionicLoading,
    $ionicPopup,
    $ionicScrollDelegate,
    RoutesService,
    BookingService,
    SharedVariableService
  ) {
    // ------------------------------------------------------------------------
    // Input
    // ------------------------------------------------------------------------
    let routeId = $stateParams.routeId ? +$stateParams.routeId : null;
    // ------------------------------------------------------------------------
    // Model
    // ------------------------------------------------------------------------
    $scope.data = {
      stops: null, // array of stop objects
      selectedStop: null // stop object
    };

    $scope.mapObject = {
      stops: [],
      routePath: [],
      alightStop: null,
      boardStop: null,
      pingTrips: [],
      allRecentPings: [],
      chosenStop: null,
    }
    // ------------------------------------------------------------------------
    // Hooks
    // ------------------------------------------------------------------------
    $scope.selectStop = (stop) => {
      $scope.data.selectedStop = stop;
      $scope.mapObject.chosenStop = stop;
      SharedVariableService.setChosenStop(stop);
    };
    $scope.done = () => {
      $state.go("tabs.crowdstart-detail", {
        routeId: routeId
      })
    };

    // ------------------------------------------------------------------------
    // Initialization
    // ------------------------------------------------------------------------
    $ionicLoading.show({
      template: `<ion-spinner icon='crescent'></ion-spinner><br/><small>Loading stop information</small>`,
      hideOnStateChange: true
    });
    RoutesService.getRoute(routeId).then(route => {
      // Load the stops data into the view
      let [pickups, dropoffs] = BookingService.computeStops(route.trips);
      $scope.data.stops = pickups.concat(dropoffs)
      if ($scope.data.selectedStop) {
        $scope.data.selectedStop = $scope.data.stops[0]
      }
      // Scroll to the selected stop if we have one
      $ionicScrollDelegate.resize();
      $ionicLoading.hide();
    }).catch(error => {
      // On error close out
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "Sorry there's been a problem loading the stop information",
        subTitle: error
      });
    });

    $scope.$on('$ionicView.afterEnter', () => {
      if ($scope.$parent.mapObject) {
        SharedVariableService.set($scope.$parent.mapObject)
      }
    })
  }
];
