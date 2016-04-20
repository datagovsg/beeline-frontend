export default function($scope, $stateParams, RoutesService) {
  $scope.data = {}

  function updateSearch() {
    $scope.search = {
      pickup:  [parseFloat($stateParams.pickupLng),  parseFloat($stateParams.pickupLat)],
      dropoff: [parseFloat($stateParams.dropoffLng), parseFloat($stateParams.dropoffLat)],
    }
  }
  updateSearch();

  $scope.$on('$ionicView.beforeEnter', function() {
    updateSearch();

    RoutesService.searchRoutes({
      startLat: $stateParams.pickupLat,
      startLng: $stateParams.pickupLng,
      endLat: $stateParams.dropoffLat,
      endLng: $stateParams.dropoffLng,
      arrivalTime: '2016-02-26 01:00:00+00',
      startTime: new Date().getTime(),
      endTime: new Date().getTime() + 30*24*60*60*1000, // search 30 days into the future
    })
    .then(function(routes) {
      $scope.data.activeRoutes = routes
    });
  });
}
