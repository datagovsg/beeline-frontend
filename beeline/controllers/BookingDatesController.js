
export default [
  '$scope',
  '$state',
  '$http',
  'BookingService',
  'RoutesService',
  '$stateParams',
  'TicketService',
  function($scope, $state, $http, BookingService,
    RoutesService, $stateParams, TicketService) {
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
        bookedDates: [],
        minDate: null,
        maxDate: null,
      };
    $scope.$on('$ionicView.beforeEnter', () => {
        $scope.book.routeId = $stateParams.routeId;
        $scope.book.boardStopId = parseInt($stateParams.boardStop);
        $scope.book.alightStopId = parseInt($stateParams.alightStop);

        RoutesService.getRoute(parseInt($scope.book.routeId))
        .then((route) => {
          $scope.book.route = route;
          updateCalendar();
        });

        TicketService.getTicketsByRouteId($scope.book.routeId)
        .then((tickets) => {
          if (!tickets) {
            $scope.book.bookedDates = [];
            return;
          }
          $scope.book.bookedDates = tickets.map(ticket => new Date(ticket.boardStop.trip.date));
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
          console.log($scope.book.selectedDates);
        }

        $scope.book.validDates = [];
        $scope.book.soldOutDates = [];
        $scope.book.invalidStopDates = [];
        $scope.book.minDate = null;
        $scope.book.maxDate = null;

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
      }
  },
];
