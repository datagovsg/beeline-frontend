import {NetworkError} from '../shared/errors';
import {formatDate, formatTime, formatUTCDate, formatHHMM_ampm} from '../shared/format';
const moment = require('moment');

export default [
  '$rootScope',
  '$scope',
  '$interpolate',
  '$state',
  '$stateParams',
  '$ionicModal',
  '$http',
  '$cordovaGeolocation',
  'BookingService',
  'RoutesService',
  'UserService',
  'uiGmapGoogleMapApi',
  'MapOptions',
  'loadingSpinner',
  '$q',
  'TicketService',
  '$interval',
  function(
    $rootScope,
    $scope,
    $interpolate,
    $state,
    $stateParams,
    $ionicModal,
    $http,
    $cordovaGeolocation,
    BookingService,
    RoutesService,
    UserService,
    uiGmapGoogleMapApi,
    MapOptions,
    loadingSpinner,
    $q,
    TicketService,
    $interval
  ) {
    // Gmap default settings
    $scope.map = MapOptions.defaultMapOptions();
    $scope.routePath = [];

    // Booking session logic
    $scope.session = {
      sessionId: null,
    };
    // Default settings for various info used in the page
    $scope.book = {
      routeId: null,
      route: null,
      boardStops: [], // all board stops for this route
      alightStops: [], // all alight stops for this route
      boardStop: null,
      alightStop: null,
      changes: {},
      nextTripDate: null,
      hasNextTripTicket: null, // user already bought the ticket
      previouslyBookedDays: null,
      buttonText: 'Book Next Trip',
      nextTripIsAvailable: null, //if availability==0
      minsBeforeClose: null,
      bookingEnds: null, //booking window close till trip ends
      buttonNotes: null, //if availability==0
      isVerifying: null, //if set to true 'express checkout' button is disabled, waiting tickets to be loaded
      nextTrip: null, //next upcoming trip
      stopNotAvailable: null //set to true if any board or alight stop is not available for express checkout date
                          //use case; operator add more stops from date x
    };
    $scope.disp = {
      popupStop: null,
      popupStopType: null,
      parentScope: $scope,
    }

    // Resolved when the map is initialized
    var gmapIsReady = new Promise((resolve, reject) => {
      var resolved = false;
      $scope.$watch('map.control.getGMap', function() {
        if ($scope.map.control.getGMap) {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        }
      });
    });

    $scope.session.sessionId = +$stateParams.sessionId;
    $scope.book.routeId = +$stateParams.routeId;

    var routePromise = RoutesService.getRoute($scope.book.routeId);

    var stopOptions = {
      initialBoardStopId: $stateParams.boardStop ? parseInt($stateParams.boardStop) : undefined,
      initialAlightStopId: $stateParams.alightStop ? parseInt($stateParams.alightStop) : undefined,
    };

    var routePostProcessingPromise = routePromise.then((route) => {
      $scope.book.route = route;
      computeStops(stopOptions);
    });

    var ridesRemainingPromise = RoutesService.fetchRoutePassCount()

    $q.all([routePromise, ridesRemainingPromise]).then(function(values){
      let ridesRemainingMap = values[1]
      if(ridesRemainingMap){
        $scope.book.route.ridesRemaining = ridesRemainingMap[$scope.book.routeId]
      } else {
        $scope.book.route.ridesRemaining = null;
      }
    })

    $scope.$on('$ionicView.afterEnter', () => {
      loadingSpinner(Promise.all([gmapIsReady, routePromise])
      .then(() => {
        var gmap = $scope.map.control.getGMap();
        MapOptions.resizePreserveCenter(gmap)
        panToStops();
      }));
    });

    gmapIsReady.then(function() {
      MapOptions.disableMapLinks();
    });

    $scope.$watch('book.route.path', (path) => {
      if (!path) {
        $scope.routePath = [];
      }
      else {
        RoutesService.decodeRoutePath(path)
        .then((decodedPath) => $scope.routePath = decodedPath)
        .catch(() => $scope.routePath = []);
      }
    })

    $scope.applyTapBoard = function (stop) {
      $scope.disp.popupStopType = "pickup";
      $scope.disp.popupStop = stop;
      $scope.$digest();
    }
    $scope.applyTapAlight = function (stop) {
      $scope.disp.popupStopType = "dropoff";
      $scope.disp.popupStop = stop;
      $scope.$digest();
    }
    $scope.setStop = function (stop, type) {
      if (type === 'pickup') {
        $scope.book.boardStop = stop;
      }
      else {
        $scope.book.alightStop = stop;
      }
      $scope.disp.popupStop = null;
    }
    $scope.closeWindow = function () {
      $scope.disp.popupStop = null;
    }

    /* Pans to the stops on the screen */
    function panToStops() {
      var stops = [];
      stops = $scope.book.boardStops.concat($scope.book.alightStops);

      if (stops.length == 0) {
        return;
      }
      var bounds = new google.maps.LatLngBounds();
      for (let s of stops) {
        bounds.extend(new google.maps.LatLng(
          s.coordinates.coordinates[1],
          s.coordinates.coordinates[0]
        ));
      }
      $scope.map.control.getGMap().fitBounds(bounds);
    }

    /** Summarizes the stops from trips by comparing their stop location and time */
    function computeStops({initialBoardStopId, initialAlightStopId}) {
      var trips = $scope.book.route.trips;
      var [boardStops, alightStops] = BookingService.computeStops(trips);
      $scope.book.boardStops = boardStops;
      $scope.book.alightStops = alightStops;

      // Check that the boardStopIds are still valid
      if (typeof(initialBoardStopId) === 'number') {
        $scope.book.boardStop = boardStops.find(ts =>
            ts.id === initialBoardStopId);
      }
      // Check that the boardStopIds are still valid
      if (typeof(initialAlightStopId) === 'number') {
        $scope.book.alightStop = alightStops.find(ts =>
            ts.id === initialAlightStopId);
      }
    }

    //get the next available trip date everytime when this view is active
    loadingSpinner(Promise.all([routePromise, ()=>UserService.verifySession()])
      .then(([route, user]) => {
        //reset the nextTripDate and windowBeforeClose when re-loaded
        $scope.book.nextTripDate = null;
        $scope.book.nextTrip = null;
        $scope.book.stopNotAvailable = null;
        $scope.book.windowBeforeClose = null;
        $scope.book.bookingEnds = null;
        var countdownTimer = null;
        var runningTrips = route.trips.filter(tr => tr.isRunning);
        //compare current date with nearest date trip's 1st board stop time
        var sortedTripInDates = _.sortBy(runningTrips,'date');
        var now = Date.now();
        for (let trip of sortedTripInDates) {
          var sortedTripStopsInTime = _.sortBy(trip.tripStops,'time');
          var bookingWindow = 0;
          var boardTime = null;
          var lastStopTime = null;
          if (trip.bookingInfo.windowSize && trip.bookingInfo.windowType) {
            if (trip.bookingInfo.windowType === 'firstStop') {
              boardTime = sortedTripStopsInTime[0].time.getTime() + trip.bookingInfo.windowSize;
            }
            //FIXME : windowType == "stop"
          }
          //if no booking window information
          if (boardTime == null) {
            boardTime = sortedTripStopsInTime[0].time.getTime();
          }
          //the trip end time
          lastStopTime = sortedTripStopsInTime[sortedTripStopsInTime.length-1].time.getTime();
          //check seat is available
          if (now < boardTime || (now >= boardTime && now <= lastStopTime)) {
            $scope.book.nextTripDate = [trip.date.getTime()];
            $scope.book.nextTrip = trip;
            $scope.book.minsBeforeClose =  moment(boardTime).diff(moment(now), 'minutes');

            //to prevent user buying trip at last minute (within booking window close to trip ends)
            if (now >= boardTime && now <= lastStopTime) {
              $scope.book.bookingEnds = true;
              break;
            }

            $scope.book.bookingEnds = false;
            // start the countdown timer
            countdownTimer = $interval(()=>{
              $scope.book.minsBeforeClose =  moment(boardTime).diff(moment(Date.now()), 'minutes');
            }, 1000*30);
            // cancel the countdown timer when reaches booking window
            if ($scope.book.minsBeforeClose && $scope.book.minsBeforeClose<=0) {
              $scope.book.bookingEnds = true;
              if (countdownTimer) {
                $interval.cancel(countdownTimer);
                countdownTimer = null;
              }
            }

            if (trip.availability.seatsAvailable > 0) {
              $scope.book.nextTripIsAvailable = true;
              $scope.book.buttonNotes = null;
            }
            else {
              $scope.book.nextTripIsAvailable = false;
              $scope.book.buttonNotes = 'Tickets are sold out';
            }

            break;
          }
        }
      }));

    // get user object
    $scope.$watchGroup([() => UserService.getUser(),
                        'book.nextTripDate',
                        ()=>TicketService.getTickets()],
                        ([user, nextTripDate, allTickets]) => {
      $scope.isLoggedIn = user ? true : false;
      $scope.user = user;
      if ($scope.isLoggedIn) {
        //if user is logged, disable the button if tickets are not loaded
        $scope.book.isVerifying = true;
        var previouslyBookedDays = null;
        if (allTickets !== null) {
          $scope.book.isVerifying = false;
          var ticketsByRouteId = _.groupBy(allTickets, ticket => ticket.boardStop.trip.routeId);
          if (ticketsByRouteId && ticketsByRouteId[$scope.book.routeId]) {
            previouslyBookedDays =  _.keyBy(ticketsByRouteId[$scope.book.routeId], t => new Date(t.boardStop.trip.date).getTime());
          }
        }
        if (previouslyBookedDays) {
          $scope.book.previouslyBookedDays = previouslyBookedDays;
          var bookedDays = Object.keys(previouslyBookedDays).map(x=>{return parseInt(x)});
          //compare current date with next trip
          if (nextTripDate && _.includes(bookedDays,nextTripDate[0])) {
            $scope.book.hasNextTripTicket = true;
            // $scope.book.buttonText = 'Go to Ticket View';
          } else {
            $scope.book.hasNextTripTicket = false;
          }
        } else {
          $scope.book.previouslyBookedDays = null;
          $scope.book.hasNextTripTicket = false;
        }
      } else {
        $scope.book.isVerifying = false;
        $scope.book.previouslyBookedDays = null;
        $scope.book.hasNextTripTicket = false;
      }
    })

    $scope.fastCheckout = function(){
      if ($scope.isLoggedIn) {
        $state.go('tabs.booking-summary', {routeId: $scope.book.routeId,
          boardStop: $scope.book.boardStop.id,
          alightStop: $scope.book.alightStop.id,
          sessionId: $scope.session.sessionId,
          selectedDates: $scope.book.nextTripDate,});
      } else {
        UserService.promptLogIn();
      }
    }

    // check selected boardstop and alightstop available for the next upcoming trip
    $scope.$watchGroup(['book.boardStop', 'book.alightStop', 'book.nextTrip'], ([boardStop, alightStop, nextTrip])=>{
      if (boardStop && alightStop && nextTrip) {
        let stopIds = nextTrip.tripStops.map(ts => ts.stop.id);
        $scope.book.stopNotAvailable = !stopIds.includes(boardStop.id) || !stopIds.includes(alightStop.id)
      }
    })

  }
];
