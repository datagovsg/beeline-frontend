export default function($scope, $stateParams, RoutesService) {
  $scope.data = {}
  RoutesService.searchRoutes($stateParams.pickupLat, $stateParams.pickupLng,
                             $stateParams.dropoffLat, $stateParams.dropoffLng)
  .then(function(results) { $scope.data.activeRoutes = results; });
}