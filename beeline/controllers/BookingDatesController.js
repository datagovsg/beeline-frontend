var moment = require('moment');

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
      validDates: [],
      soldOutDates: [],
      bookedDates: [],
      today: moment(),
      availabilityDays: {},
      previouslyBookedDays: {},
      highlightDays: [],
      daysAllowed: [Date.UTC(2016,5,15)],
      selectedDatesLocal: [],
    };
    $scope.$on('$ionicView.beforeEnter', () => {
        $scope.book.routeId = $stateParams.routeId;
        $scope.book.boardStopId = parseInt($stateParams.boardStop);
        $scope.book.alightStopId = parseInt($stateParams.alightStop);

        $scope.disp.dataLoading = true;

        RoutesService.getRoute(parseInt($scope.book.routeId), true, {include_availability: true})
        .then((route) => {
          $scope.book.route = route;
          updateCalendar();
        });

        TicketService.getTicketsByRouteId($scope.book.routeId)
        .then((tickets) => {
          if (!tickets) {
            $scope.disp.previouslyBookedDays = {};
            return;
          }
          $scope.disp.previouslyBookedDays = _.keyBy(tickets, t => new Date(t.boardStop.trip.date).getTime());
        });
      });

    $scope.$watch('disp.selectedDatesLocal', () => {
      // multiple-date-picker gives us the
      // date in midnight local time
      // Need to convert to UTC
      $scope.book.selectedDates = $scope.disp.selectedDatesLocal
          .map(m => moment(m).add(m.utcOffset(), 'minutes').valueOf())
      console.log($scope.book.selectedDates)
    }, true)

    $scope.$watchGroup(['disp.availabilityDays', 'disp.previouslyBookedDays'],
      () => {
        $scope.disp.highlightDays = [];
        $scope.disp.daysAllowed = [];

        for (let time of Object.keys($scope.disp.availabilityDays)) {
          time = parseInt(time)
          if ($scope.disp.availabilityDays[time] <= 0) {
            $scope.disp.highlightDays.push({
              date: time,
              css: 'sold-out',
              selectable: false,
            })
          }
          else if (time in $scope.disp.previouslyBookedDays) {
            $scope.disp.highlightDays.push({
              date: time,
              css: 'previously-booked',
              selectable: false,
            })
          }
          else {
            $scope.disp.highlightDays.push({
              date: time,
              css: '',
              selectable: true,
            })
            $scope.disp.daysAllowed.push(moment(time))
          }
        }
      })

    function updateCalendar() {
      if (!$scope.book.route) {
        return;
      }

      // set up the valid days
      if ($scope.book.route) {
        $scope.book.selectedDates =
              $scope.book.selectedDates || [];
      }

      // reset
      $scope.disp.availabilityDays = {}

      for (let trip of $scope.book.route.trips) {
        // FIXME: disable today if past the booking window

        // Make it available, only if the stop is valid for this trip
        var tripStops_stopIds = trip.tripStops.map(ts => ts.stop.id);
        if (_.intersection([$scope.book.boardStopId],
                           tripStops_stopIds).length == 0 ||
            _.intersection([$scope.book.alightStopId],
                           tripStops_stopIds).length == 0
            ) {
          continue;
        }

        $scope.disp.availabilityDays[trip.date.getTime()] = trip.availability.seatsAvailable;
      }

      $scope.disp.dataLoading = false;
    }
  },
];
