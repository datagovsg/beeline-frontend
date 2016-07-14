var moment = require('moment');

export default [
  '$scope',
  '$state',
  '$http',
  'BookingService',
  'RoutesService',
  '$stateParams',
  'TicketService',
  'loadingSpinner', '$q', '$ionicScrollDelegate',
  function($scope, $state, $http, BookingService,
    RoutesService, $stateParams, TicketService, loadingSpinner, $q,
  $ionicScrollDelegate) {
    var now = new Date();

    // Data logic;
    $scope.book = {
      routeId: '',
      route: null,
      boardStopId: undefined,
      alightStopId: undefined,
      priceInfo: {},
      selectedDates: [],
      invalidStopDates: [],
    };
    // Display Logic;
    $scope.disp = {
      month: moment(),
      validDates: [],
      soldOutDates: [],
      bookedDates: [],
      today: moment(),
      availabilityDays: {},
      previouslyBookedDays: {},
      highlightDays: [],
      daysAllowed: [],
      selectedDatesMoments: [],
    };
    $scope.$on('$ionicView.beforeEnter', () => {
        $scope.book.routeId = $stateParams.routeId;
        $scope.book.boardStopId = parseInt($stateParams.boardStop);
        $scope.book.alightStopId = parseInt($stateParams.alightStop);

        $scope.disp.dataLoading = true;
        $scope.disp.availabilityDays = {};
        $scope.disp.previouslyBookedDays = {};

        // FIXME: Need to handle booking windows correctly
        var routePromise = RoutesService.getRoute(parseInt($scope.book.routeId))
        var ticketsPromise = TicketService.getTicketsByRouteId($scope.book.routeId)
          .catch((err) => null)

        // Cause all the updates to the $watch-ed elements to be assigned
        // together, reducing the number of digests.
        loadingSpinner($q.all([routePromise, ticketsPromise]).then(([route, tickets]) => {
          // Route
          $scope.book.route = route;
          updateCalendar(); // updates availabilityDays

          // Tickets
          if (!tickets) {
            $scope.disp.previouslyBookedDays = {};
            return;
          }
          $scope.disp.previouslyBookedDays = _.keyBy(tickets, t => new Date(t.boardStop.trip.date).getTime());
        }));
      });

    $scope.$watch(
      /* Don't watch the entire moment objects, just their value */
      () => $scope.disp.selectedDatesMoments.map(m => m.valueOf()),
      () => {
      // multiple-date-picker gives us the
      // date in midnight local time
      // Need to convert to UTC
      $scope.book.selectedDates = $scope.disp.selectedDatesMoments.map(
        m => m.valueOf()
      )
    }, true)

    $scope.$watchGroup(['disp.availabilityDays', 'disp.previouslyBookedDays'],
      () => {
        $scope.disp.highlightDays = [];
        $scope.disp.daysAllowed = [];

        for (let time of Object.keys($scope.disp.availabilityDays)) {
          time = parseInt(time)
          let timeMoment = moment(time).utcOffset(0);
          if ($scope.disp.availabilityDays[time] <= 0) {
            $scope.disp.highlightDays.push({
              date: timeMoment,
              css: 'sold-out',
              selectable: false,
              annotation: $scope.book.route.tripsByDate[time].bookingInfo &&
                          $scope.book.route.tripsByDate[time].bookingInfo.notes && ' ',
            })
          }
          else if (time in $scope.disp.previouslyBookedDays) {
            $scope.disp.highlightDays.push({
              date: timeMoment,
              css: 'previously-booked',
              selectable: false,
              annotation: $scope.book.route.tripsByDate[time].bookingInfo &&
                          $scope.book.route.tripsByDate[time].bookingInfo.notes && ' ',
            })
          }
          else {
            $scope.disp.highlightDays.push({
              date: timeMoment,
              css: '',
              selectable: true,
              annotation: $scope.book.route.tripsByDate[time].bookingInfo &&
                          $scope.book.route.tripsByDate[time].bookingInfo.notes && ' ',
            })
            $scope.disp.daysAllowed.push(timeMoment)
          }
        }
      })

    $scope.$on('priceCalculator.done', () => {
      $ionicScrollDelegate.resize();
    })

    function updateCalendar() {
      // ensure cancelled trips are not shown
      var runningTrips = $scope.book.route.trips.filter(tr => tr.status !== 'cancelled');

      // discover which month to show. Use UTC timezone
      $scope.disp.month = moment(_.min(runningTrips.map(t => t.date))).utcOffset(0);

      // reset
      $scope.disp.availabilityDays = {}

      // booking window restriction
      var now = Date.now();

      for (let trip of runningTrips) {
        // FIXME: disable today if past the booking window

        // Make it available, only if the stop is valid for this trip
        var stopIds = trip.tripStops
          .filter(t => t.time.getTime() > now)
          .map(ts => ts.stop.id);
        if (stopIds.indexOf($scope.book.boardStopId) === -1 ||
            stopIds.indexOf($scope.book.alightStopId) === -1) {
          continue;
        }

        $scope.disp.availabilityDays[trip.date.getTime()] = trip.availability.seatsAvailable;
      }

      $scope.disp.dataLoading = false;
    }
  },
];
