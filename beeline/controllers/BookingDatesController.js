
export default [
    '$scope',
    '$state',
    '$http',
    'BookingService',
    function ($scope, $state, $http, BookingService) {
        // navigate away if we don't have data (e.g. due to refresh)
        if (!BookingService.currentBooking) {
            $state.go('tabs.booking-pickup');
        }
        //
        $scope.BookingService = BookingService;

        // watches
        function updateCalendar() {
            if (!BookingService.routeInfo || !BookingService.currentBooking) {
                return;
            }

            // set up the valid days
            if ($scope.BookingService.currentBooking) {
                $scope.BookingService.currentBooking.selectedDates = 
                    $scope.BookingService.currentBooking.selectedDates || [];
                $scope.BookingService.currentBooking.qty = 
                    $scope.BookingService.currentBooking.qty || 1;
            }

            $scope.validDates = [];
            $scope.exhaustedDates = [];
            $scope.invalidStopDates = [];
            $scope.minDate = null;
            $scope.maxDate = null;

            for (let trip of BookingService.routeInfo.trips) {
                // FIXME: disable today if past the booking window
                $scope.validDates.push(trip.date);
                
                if (!$scope.minDate || $scope.minDate > trip.date.getTime()) {
                    $scope.minDate = trip.date.getTime();
                }
                if (!$scope.maxDate || $scope.maxDate < trip.date.getTime()) {
                    $scope.maxDate = trip.date.getTime();
                }

                // Check that quantity <= trips.available
                if (BookingService.currentBooking.qty > trip.seatsAvailable) {
                    $scope.exhaustedDates.push(trip.date);
                }

                // Check that the stops are available
                var tripStops_stopIds = trip.tripStops.map(ts => ts.stop.id);
                if (_.intersection([BookingService.currentBooking.boardStop],
                                   tripStops_stopIds).length == 0 ||
                    _.intersection([BookingService.currentBooking.alightStop],
                                   tripStops_stopIds).length == 0 
                    ) {
                    $scope.invalidStopDates.push(trip.date);
                }
                // console.log(tripStops_stopIds);
                // console.log($scope);
            }
        }
        /** FIXME this can be potentially very slow. Should ignore the routeInfo entry **/
        // $scope.$watch('BookingService', updateCalendar, true);
        $scope.$watch(() => [BookingService.currentBooking, BookingService.routeInfo ? BookingService.routeInfo.id : null], updateCalendar, true);
        updateCalendar();
        
        /** FIXME this can be potentially very slow. Should ignore the routeInfo entry **/
        $scope.$watch('BookingService.currentBooking', () => BookingService.updatePrice($scope, $http), true);
        BookingService.updatePrice($scope, $http);

        // methods
        $scope.goToSummary = function() {
            $state.go('tabs.booking-summary');
        };
    },
];

