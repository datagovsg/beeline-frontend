
export default [
    '$scope',
    '$state',
    '$http',
    'bookingService',
    function ($scope, $state, $http, bookingService) {
        // navigate away if we don't have data (e.g. due to refresh)
        if (!bookingService.currentBooking) {
            $state.go('tab.booking-pickup');
        }
        //
        $scope.bookingService = bookingService;

        // watches
        function updateCalendar() {
            if (!bookingService.routeInfo || !bookingService.currentBooking) {
                return;
            }

            // set up the valid days
            if ($scope.bookingService.currentBooking) {
                $scope.bookingService.currentBooking.selectedDates = 
                    $scope.bookingService.currentBooking.selectedDates || [];
                $scope.bookingService.currentBooking.qty = 
                    $scope.bookingService.currentBooking.qty || 1;
            }

            $scope.validDates = [];
            $scope.exhaustedDates = [];
            $scope.invalidStopDates = [];
            $scope.minDate = null;
            $scope.maxDate = null;

            for (let trip of bookingService.routeInfo.trips) {
                // FIXME: disable today if past the booking window
                $scope.validDates.push(trip.date);
                
                if (!$scope.minDate || $scope.minDate > trip.date.getTime()) {
                    $scope.minDate = trip.date.getTime();
                }
                if (!$scope.maxDate || $scope.maxDate < trip.date.getTime()) {
                    $scope.maxDate = trip.date.getTime();
                }

                // Check that quantity <= trips.available
                if (bookingService.currentBooking.qty > trip.seatsAvailable) {
                    $scope.exhaustedDates.push(trip.date);
                }

                // Check that the stops are available
                var tripStops_stopIds = trip.tripStops.map(ts => ts.stop.id);
                if (_.intersection([bookingService.currentBooking.boardStop],
                                   tripStops_stopIds).length == 0 ||
                    _.intersection([bookingService.currentBooking.alightStop],
                                   tripStops_stopIds).length == 0 
                    ) {
                    $scope.invalidStopDates.push(trip.date);
                }
                // console.log(tripStops_stopIds);
                // console.log($scope);
            }
        }
        /** FIXME this can be potentially very slow. Should ignore the routeInfo entry **/
        // $scope.$watch('bookingService', updateCalendar, true);
        $scope.$watch(() => [bookingService.currentBooking, bookingService.routeInfo ? bookingService.routeInfo.id : null], updateCalendar, true);
        updateCalendar();
        
        /** FIXME this can be potentially very slow. Should ignore the routeInfo entry **/
        $scope.$watch('bookingService.currentBooking', () => bookingService.updatePrice($scope, $http), true);
        bookingService.updatePrice($scope, $http);

        // methods
        $scope.goToSummary = function() {
            $state.go('tab.booking-summary');
        };
    },
];

