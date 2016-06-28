var moment = require('moment');

export default [
  '$scope',
  '$state',
  '$http',
  'BookingService',
  'RoutesService',
  '$stateParams',
  'TicketService',
  'loadingSpinner',
  function($scope, $state, $http, BookingService,
    RoutesService, $stateParams, TicketService, loadingSpinner) {
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
        $scope.disp.availabilityDays = {};
        $scope.disp.previouslyBookedDays = {};

        // FIXME: Need to handle booking windows correctly
        loadingSpinner(RoutesService.getRoute(parseInt($scope.book.routeId), true, {
          include_availability: true,
          start_date: Date.now(),
        })
        .then((route) => {
          $scope.book.route = route;
          updateCalendar();
        }));

        loadingSpinner(TicketService.getTicketsByRouteId($scope.book.routeId)
        .then((tickets) => {
          if (!tickets) {
            $scope.disp.previouslyBookedDays = {};
            return;
          }
          $scope.disp.previouslyBookedDays = _.keyBy(tickets, t => new Date(t.boardStop.trip.date).getTime());
        }));
      });

    $scope.$watch('disp.selectedDatesLocal', () => {
      // multiple-date-picker gives us the
      // date in midnight local time
      // Need to convert to UTC
      $scope.book.selectedDates = $scope.disp.selectedDatesLocal.map(
        m => moment(m).add(m.utcOffset(), 'minutes').valueOf())
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

      // reset
      $scope.disp.availabilityDays = {}

      for (let trip of $scope.book.route.trips) {
        // FIXME: disable today if past the booking window

        // Make it available, only if the stop is valid for this trip
        var stopIds = trip.tripStops.map(ts => ts.stop.id);
        if (_.intersection([$scope.book.boardStopId],
                           stopIds).length === 0 ||
            _.intersection([$scope.book.alightStopId],
                           stopIds).length === 0
            ) {
          continue;
        }

        $scope.disp.availabilityDays[trip.date.getTime()] = trip.availability.seatsAvailable;
      }

      $scope.disp.dataLoading = false;
    }
  },
];
