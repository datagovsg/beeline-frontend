
export default [
    '$scope',
    '$state',
    '$http',
    'BookingService',
    'RoutesService',
    function ($scope, $state, $http, BookingService,
    RoutesService) {
      $scope.currentBooking = {};
      $scope.currentRouteInfo = {};
      $scope.$on('$ionicView.beforeEnter', () => {
        $scope.currentBooking = BookingService.getCurrentBooking();
      });

      // display
      $scope.validDates = [];
      $scope.soldOutDates = [];
      $scope.invalidStopDates = [];
      $scope.minDate = null;
      $scope.maxDate = null;

      // watches
      function updateCalendar() {
        if (!$scope.currentBooking.route) {
          // For development purposes, we could do this...
          RoutesService.getRoute($scope.currentBooking.routeId)
          .then((route) => {
            $scope.currentBooking.route = route;
            if (route) {
              updateCalendar();
            }
          })
          return;
        }

        // set up the valid days
        if ($scope.currentBooking) {
            $scope.currentBooking.selectedDates =
                $scope.currentBooking.selectedDates || [];
            $scope.currentBooking.qty =
                $scope.currentBooking.qty || 1;
        }

        $scope.validDates = [];
        $scope.soldOutDates = [];
        $scope.invalidStopDates = [];
        $scope.minDate = null;
        $scope.maxDate = null;

        for (let trip of $scope.currentBooking.route.trips) {
          // FIXME: disable today if past the booking window
          $scope.validDates.push(trip.date);

          if (!$scope.minDate || $scope.minDate > trip.date.getTime()) {
              $scope.minDate = trip.date.getTime();
          }
          if (!$scope.maxDate || $scope.maxDate < trip.date.getTime()) {
              $scope.maxDate = trip.date.getTime();
          }

          // Check that quantity <= trips.available
          if ($scope.currentBooking.qty > trip.seatsAvailable) {
              $scope.soldOutDates.push(trip.date);
          }

          // Check that the stops are available
          var tripStops_stopIds = trip.tripStops.map(ts => ts.stop.id);
          if (_.intersection([$scope.currentBooking.boardStop],
                             tripStops_stopIds).length == 0 ||
              _.intersection([$scope.currentBooking.alightStop],
                             tripStops_stopIds).length == 0
              ) {
              $scope.invalidStopDates.push(trip.date);
          }
        }
      };

      $scope.$watch('currentBooking.selectedDates',
        () => {
          BookingService.computePriceInfo($scope.currentBooking)
          .then((priceInfo) => {
            $scope.currentBooking.priceInfo = priceInfo;
          });
          console.log('booking changed!')
          updateCalendar();
        }, true);
    },
  ];
