
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
        routeid: '',
        route: null,
        qty: '',
        boardStop: undefined,
        alightStop: undefined,
        priceInfo: {},
        validDates: [],
        soldOutDates: [],
        invalidStopDates: [],
        selectedDates: [],
        minDate: null,
        maxDate: null,
      };
      $scope.$on('$ionicView.beforeEnter', () => {
        $scope.book.routeid = $stateParams.routeId;
        $scope.book.boardStop =  parseInt($stateParams.boardStop);
        $scope.book.alightStop =  parseInt($stateParams.alightStop);
        RoutesService.getRoute($scope.book.routeid)
        .then((route) => {
          $scope.book.route = route;
          console.log($scope.book.route);
          updateCalendar();
        });
      });

      // watches
      function updateCalendar() {
        if (!$scope.book.route) {
          // For development purposes, we could do this...
          // RoutesService.getRoute($scope.book.routeid)
          // .then((route) => {
          //   $scope.book.route = route;
          //   if (route) {
          //     updateCalendar();
          //   }
          // })
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
          if (_.intersection([$scope.book.boardStop],
                             tripStops_stopIds).length == 0 ||
              _.intersection([$scope.book.alightStop],
                             tripStops_stopIds).length == 0
              ) {
              $scope.book.invalidStopDates.push(trip.date);
          }
        }
      };

      $scope.$watch('book.selectedDates',
        () => {
          console.log($scope.book.selectedDates);
          BookingService.computePriceInfo($scope.book)
          .then((priceInfo) => {
            $scope.book.priceInfo = priceInfo;
          });
          console.log('booking changed!')
          updateCalendar();
        }, true);
    },
  ];
