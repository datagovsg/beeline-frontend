import _ from 'lodash'

export default [
  '$scope',
  '$state',
  '$stateParams',
  'BookingService',
  'CompanyService',
  'UserService',
  'CrowdstartService',
  '$ionicHistory',
  function (
    $scope,
    $state,
    $stateParams,
    BookingService,
    CompanyService,
    UserService,
    CrowdstartService,
    $ionicHistory
  ) {
    // ------------------------------------------------------------------------
    // Helper functions
    // ------------------------------------------------------------------------
    const updateBidded = async function updateBidded ([user, routePromise]) {
      const route = await routePromise
      if (!route) return

      if (!user || routeId === 'preview') {
        $scope.disp.bidded = false
        return
      }

      // Figure out if user has bidded on this crowdstart route
      let userIds = route.bids.map(bid => bid.userId)
      $scope.disp.bidded = userIds.includes(user.id)
    }
    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let routeId = $stateParams.routeId ? Number($stateParams.routeId) : null
    routeId = $stateParams.routeId === 'preview' ? $stateParams.routeId : routeId

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.routePath = []

    // Default settings for various info used in the page
    $scope.book = {
      routeId,
      route: null,
      bid: null,
      calculatedAmount: '',
      bidPrice: null,
    }

    $scope.disp = {
      showHamburger: null,
      bidded: null,
    }

    // ------------------------------------------------------------------------
    // Ionic Events
    // ------------------------------------------------------------------------
    $scope.$on('$ionicView.beforeLeave', function () {
      // to make the join crowdstart button not flash when the page loads
      $scope.disp.bidded = null
    })

    $scope.$on('$ionicView.enter', function () {
      // For re-computing bidded correctly when re-entering the page
      updateBidded([
        UserService.getUser(),
        CrowdstartService.getCrowdstartById($scope.book.routeId),
      ])
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
      () => CrowdstartService.getCrowdstartById($scope.book.routeId),
      async routePromise => {
        const route = await routePromise
        if (!route) return
        $scope.book.route = route
        $scope.book.bidOptions = route.notes.tier
        ;[
          $scope.book.boardStops,
          $scope.book.alightStops,
        ] = BookingService.getStopsFromTrips($scope.book.route.trips)
        $scope.busStops = $scope.book.boardStops.concat($scope.book.alightStops)

        CompanyService.getCompany(route.transportCompanyId).then(company => {
          $scope.disp.company = company
        })
      }
    )

    $scope.$watchGroup(
      [
        () => UserService.getUser(),
        () => CrowdstartService.getCrowdstartById($scope.book.routeId),
      ],
      updateBidded
    )

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
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
