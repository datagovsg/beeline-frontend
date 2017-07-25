export default [
  "$scope",
  "$state",
  "$stateParams",
  function($scope, $state, $stateParams) {
    $scope.routeId = $stateParams.routeId;
    $scope.pickupStop = "no stop picked";
    $scope.chooseStop = function() {
      $state.go("tabs.route-stops", {
        routeId: $stateParams.routeId,
        type: "pickup",
        callback: function(stop) {
          $scope.pickupStop = stop;
        }
      });
    };
  }
];