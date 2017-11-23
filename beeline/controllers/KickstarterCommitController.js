export default [
  '$scope',
  '$stateParams',
  '$window',
  'KickstarterService',
  function(
    $scope,
    $stateParams,
    $window,
    KickstarterService
  ) {
    // Default settings for various info used in the page
    $scope.book = {
      routeId: null,
      boardStopId: null,
      alightStopId: null,
      route: null,
      notExpired: true,
      bidPrice: null,
    }

    $scope.book.routeId = Number($stateParams.routeId)
    $scope.showCopy = !$window.cordova || false

    $scope.$watchGroup([() => KickstarterService.getCrowdstartById($scope.book.routeId), () => KickstarterService.getBidInfo($scope.book.routeId)], ([route, bid]) => {
      if (!route) return
      $scope.book.route = route
      if (!bid) return
      $scope.book.bidPrice = bid.bidPrice
      $scope.book.boardStop = $scope.book.route.trips[0]
            .tripStops
            .find((ts) => bid.boardStopId === ts.stop.id)
      $scope.book.alightStop = $scope.book.route.trips[0]
            .tripStops
            .find((ts) => bid.alightStopId === ts.stop.id)
    })
  },
]
