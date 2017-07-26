export default [
  "$scope",
  "$state",
  "$stateParams",
  "$ionicLoading",
  "$ionicPopup",
  "UserService",
  "RoutesService",
  "BookingService",
  function(
    $scope, 
    $state, 
    $stateParams, 
    $ionicLoading,
    $ionicPopup,
    UserService, 
    RoutesService,
    BookingService
  ) {
    // ------------------------------------------------------------------------
    // Input
    // ------------------------------------------------------------------------
    let routeId = $stateParams.routeId ? +$stateParams.routeId : null;
    let pickupStopId = $stateParams.pickupStopId 
                         ? +$stateParams.pickupStopId 
                         : null;
    let dropoffStopId = $stateParams.dropoffStopId 
                          ? +$stateParams.dropoffStopId 
                          : null;

    // ------------------------------------------------------------------------
    // Model
    // ------------------------------------------------------------------------
    $scope.data = {
      pickupStop: null,
      dropoffStop: null,
      passCount: null,
      price: null
    }

    // ------------------------------------------------------------------------ 
    // Hooks 
    // ------------------------------------------------------------------------
    $scope.choosePickup = () => {
      $state.go("tabs.route-stops", {
        routeId: routeId,
        type: "pickup",
        stopId: $scope.data.pickupStop.id,
        callback: (stop) => {
          $scope.data.pickupStop = stop;
        }
      });
    };

    $scope.chooseDropoff = () => {
      $state.go("tabs.route-stops", {
        routeId: routeId,
        type: "dropoff",
        stopId: $scope.data.dropoffStop.id,
        callback: (stop) => {
          $scope.data.dropoffStop = stop;
        }
      });
    };

    $scope.bookNext = () => {
      UserService.loginIfNeeded().then((output) => {
        console.log("finished loginIfNeeded", output);
      }).catch(error => {
        console.log("error loginIfNeeded", error);
      });
    };

    // ------------------------------------------------------------------------
    // Initialization
    // ------------------------------------------------------------------------

    // Load the route information
    // Show a loading overlay while we wait
    $ionicLoading.show({
      template: `<ion-spinner icon='crescent'></ion-spinner><br/><small>Loading route information</small>`,
      hideOnStateChange: true
    });
    RoutesService.getRoute(routeId).then(route => {
      $ionicLoading.hide();
      // Grab the price data
      $scope.data.price = route.trips[0].price;
      // Grab the stop data
      let [pickups, dropoffs] = BookingService.computeStops(route.trips);
      pickups = new Map(pickups.map(stop => [stop.id, stop])); 
      dropoffs = new Map(dropoffs.map(stop => [stop.id, stop])); 
      if (pickupStopId) $scope.data.pickupStop = pickups.get(pickupStopId);
      if (dropoffStopId) $scope.data.dropoffStop = dropoffs.get(dropoffStopId);
    }).catch(error => {
      $ionicLoading.hide();
      $ionicPopup.alert({ 
        title: "Sorry there's been a problem loading the route information",
        subTitle: error
      });
    });

    // Get the route credits
    $scope.$watch(
      () => RoutesService.getPassCountForRoute(routeId),
      (passCount) => { $scope.data.passCount = passCount; } 
    )

  }
];