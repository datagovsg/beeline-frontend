
export default [
    '$scope',
    '$state',
    '$http',
    'BookingService',
    'RoutesService',
    '$stateParams',
    function ($scope, $state, $http, BookingService,
    RoutesService,$stateParams) {
      $scope.book = {
        routeId: '',
        route: null,
        qty: '',
        boardStopId: undefined,
        alightStopId: undefined,
        priceInfo: {},
        validDates: [],
        soldOutDates: [],
        invalidStopDates: [],
        selectedDates: [],
        minDate: null,
        maxDate: null,
      };
      $scope.$on('$ionicView.beforeEnter', () => {
        $scope.book.routeId = $stateParams.routeId;
        $scope.book.boardStopId =  parseInt($stateParams.boardStop);
        $scope.book.alightStopId =  parseInt($stateParams.alightStop);
        RoutesService.getRoute($scope.book.routeId)
        .then((route) => {
          $scope.book.route = route;
          console.log($scope.book.route);
          updateCalendar();
        });
      });

      // watches
      function updateCalendar() {
        if (!$scope.book.route) {
          return;
        }

        // set up the valid days
        if ($scope.book.route) {
            $scope.book.selectedDates =
                $scope.book.selectedDates || [];
            $scope.book.qty =
                $scope.book.qty || 1;
            console.log($scope.book.selectedDates)
        }

        $scope.book.validDates = [];
        $scope.book.soldOutDates = [];
        $scope.book.invalidStopDates = [];
        $scope.book.minDate = null;
        $scope.book.maxDate = null;
        console.log($scope.book.route);
        console.log($scope.book.route.trips);
        for (let trip of $scope.book.route.trips) {
          // FIXME: disable today if past the booking window
          $scope.book.validDates.push(trip.date);

          if (!$scope.book.minDate || $scope.book.minDate > trip.date.getTime()) {
              $scope.book.minDate = trip.date.getTime();
          }
          if (!$scope.book.maxDate || $scope.book.maxDate < trip.date.getTime()) {
              $scope.book.maxDate = trip.date.getTime();
          }

          // Check that quantity <= trips.available
          if ($scope.book.qty > trip.seatsAvailable) {
              $scope.book.soldOutDates.push(trip.date);
          }

          // Check that the stops are available
          var tripStops_stopIds = trip.tripStops.map(ts => ts.stop.id);
          if (_.intersection([$scope.book.boardStopId],
                             tripStops_stopIds).length == 0 ||
              _.intersection([$scope.book.alightStopId],
                             tripStops_stopIds).length == 0
              ) {
              $scope.book.invalidStopDates.push(trip.date);
          }
        }
      };
    },
  ];
