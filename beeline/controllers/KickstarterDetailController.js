import _ from 'lodash'

export default [
  '$scope',
  '$state',
  '$stateParams',
  'BookingService',
  'KickstarterService',
  function (
    $scope,
    $state,
    $stateParams,
    BookingService,
    KickstarterService
  ) {
    $scope.routePath = []

    // Default settings for various info used in the page
    $scope.book = {
      routeId: null,
      route: null,
      bid: null,
      calculatedAmount: '',
      bidPrice: null,
    }

    $scope.book.routeId = Number($stateParams.routeId)

    $scope.$watch(
      () => KickstarterService.getCrowdstartById($scope.book.routeId),
      (route) => {
        if (!route) return
        $scope.book.route = route
        $scope.book.routeDescription = route.label + ' ' + route.from + ' - ' + route.to
        $scope.book.bidOptions = route.notes.tier;
        [$scope.book.boardStops, $scope.book.alightStops] = BookingService
          .computeStops($scope.book.route.trips)
        $scope.busStops = $scope.book.boardStops.concat($scope.book.alightStops)
      }
    )

    $scope.showStops = function () {
      $state.go('tabs.crowdstart-stops', {
        routeId: $scope.book.routeId,
      })
    }

    $scope.updateSelection = function (position, tiers, price) {
      _.forEach(tiers, function (tier, index) {
        if (position === index) {
          $scope.book.bidPrice = $scope.book.bidPrice === price ? null : price
        }
      })
    }
  },
]
