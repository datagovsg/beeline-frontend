export default [
  "$scope",
  "$stateParams",
  "$window",
  "KickstarterService",
  function($scope, $stateParams, $window, KickstarterService) {
    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let routeId = $stateParams.routeId ? Number($stateParams.routeId) : null
    let showCopy = !$window.cordova || false

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    // Default settings for various info used in the page
    $scope.book = {
      routeId: null,
      boardStopId: null,
      alightStopId: null,
      route: null,
      notExpired: true,
      bidPrice: null,
    }

    $scope.book.routeId = routeId
    $scope.showCopy = showCopy

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    /*
      Set boardStop and alightStop based on info in bid
     */
    $scope.$watchGroup(
      [
        () => KickstarterService.getCrowdstartById($scope.book.routeId),
        () => KickstarterService.getBidInfo($scope.book.routeId),
      ],
      async ([routePromise, bid]) => {
        const route = await routePromise
        if (!route) return
        $scope.book.route = route
        if (!bid) return
        $scope.book.bidPrice = bid.bidPrice
        $scope.book.boardStop = $scope.book.route.trips[0].tripStops.find(
          ts => bid.boardStopId === ts.stop.id
        )
        $scope.book.alightStop = $scope.book.route.trips[0].tripStops.find(
          ts => bid.alightStopId === ts.stop.id
        )
      }
    )
  },
]
