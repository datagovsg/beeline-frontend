export default [
  "$scope",
  "$state",
  "$stateParams",
  function($scope, $state, $stateParams) {
    $scope.data = {
      pickupStop: null,
      dropoffStop: null
    }
    let routeId = $stateParams.routeId;
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
  }
];