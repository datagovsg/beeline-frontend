export default [
  "$scope",
  "$state",
  "$stateParams",
  function($scope, $state, $stateParams) {
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
    // ------------------------------------------------------------------------
    // Initialization
    // ------------------------------------------------------------------------
  }
];