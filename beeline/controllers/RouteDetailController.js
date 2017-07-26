export default [
  "$scope",
  "$state",
  "$stateParams",
  "UserService",
  "RoutesService",
  function($scope, $state, $stateParams, UserService, RoutesService) {
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
      passCount: null,
      pickupStop: null,
      dropoffStop: null
    }

    // ------------------------------------------------------------------------ 
    // Hooks 
    // ------------------------------------------------------------------------
    $scope.choosePickup = () => {
      $state.go("tabs.route-stops", {
        routeId: routeId,
        type: "pickup",
        stop: $scope.data.pickupStop,
        callback: (stop) => {
          $scope.data.pickupStop = stop;
        }
      });
    };

    $scope.chooseDropoff = () => {
      $state.go("tabs.route-stops", {
        routeId: routeId,
        type: "dropoff",
        stop: $scope.data.dropoffStop,
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
    $scope.$watch(
      () => RoutesService.getPassCountForRoute(routeId),
      (passCount) => { $scope.data.passCount = passCount; } 
    )

  }
];