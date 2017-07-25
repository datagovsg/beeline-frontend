export default [
  "$scope",
  "$state",
  "$stateParams",
  "$ionicHistory",
  function($scope, $state, $stateParams, $ionicHistory) {
    $scope.routeId = $stateParams.routeId;
    $scope.chooseStop = function(stop) {
      $stateParams.callback(stop);
      $ionicHistory.goBack();
    };
  }
];