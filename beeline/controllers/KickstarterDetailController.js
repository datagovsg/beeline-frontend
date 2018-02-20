import _ from "lodash"

export default [
  "$scope",
  "$state",
  "$stateParams",
  "BookingService",
  "KickstarterService",
  "$ionicHistory",
  function(
    $scope,
    $state,
    $stateParams,
    BookingService,
    KickstarterService,
    $ionicHistory
  ) {
    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let routeId = $stateParams.routeId ? Number($stateParams.routeId) : null

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.routePath = []

    // Default settings for various info used in the page
    $scope.book = {
      routeId,
      route: null,
      bid: null,
      calculatedAmount: "",
      bidPrice: null,
    }

    $scope.disp = {
      showHamburger: null,
    }

    // ------------------------------------------------------------------------
    // Ionic Events
    // ------------------------------------------------------------------------
    $scope.$on("$ionicView.enter", function() {
      if ($ionicHistory.backView()) {
        $scope.disp.showHamburger = false
      } else {
        $scope.disp.showHamburger = true
      }
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch(
      () => KickstarterService.getCrowdstartById($scope.book.routeId),
      route => {
        if (!route) return
        $scope.book.route = route
        $scope.book.bidOptions = route.notes.tier
        ;[
          $scope.book.boardStops,
          $scope.book.alightStops,
        ] = BookingService.getStopsFromTrips($scope.book.route.trips)
        $scope.busStops = $scope.book.boardStops.concat($scope.book.alightStops)
      }
    )

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.showStops = function() {
      $state.go("tabs.crowdstart-stops", {
        routeId: $scope.book.routeId,
      })
    }

    $scope.updateSelection = function(position, tiers, price) {
      _.forEach(tiers, function(tier, index) {
        if (position === index) {
          $scope.book.bidPrice = $scope.book.bidPrice === price ? null : price
        }
      })
    }
  },
]
