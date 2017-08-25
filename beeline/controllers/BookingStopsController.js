import {NetworkError} from '../shared/errors';
import {formatDate, formatTime, formatUTCDate, formatHHMM_ampm} from '../shared/format';
const moment = require('moment');
import routePassTemplate from '../templates/route-pass-modal.html';
import processingPaymentsTemplate from '../templates/processing-payments.html';
import assert from 'assert';

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
  'StripeService',
  '$ionicLoading',
  '$ionicPopup',
  'assetScopeModalService',
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
    $interval,
    StripeService,
    $ionicLoading,
    $ionicPopup,
    assetScopeModalService
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
      stopNotAvailable: null, //set to true if any board or alight stop is not available for express checkout date
                          //use case; operator add more stops from date x
      routePassChoice: null, // index chosen in the route pass modal
      routePassPrice: null,
      ridesRemaining: 0,
      routeSupportsRoutePass : null,
      acceptPolicy: null, // T&Cs in the modal
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
      $scope.book.routeSupportsRoutePass = _.some($scope.book.route.tags, function (tag) {
        // to stop selling route pass, route.notes.passSizes is undefined or empty array
        return tag.includes('rp-')  && $scope.book.route.notes && $scope.book.route.notes.passSizes && $scope.book.route.notes.passSizes.length > 0
      })
      computeStops(stopOptions);
    });


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
                        ()=>TicketService.getTickets(),
                        ()=>RoutesService.getRoutePassCount()],
                        ([user, nextTripDate, allTickets, routeToRidesRemainingMap]) => {
      $scope.book.isLoggedIn = user ? true : false;
      $scope.user = user;
      if ($scope.book.isLoggedIn) {
        //if user is logged, disable the button if tickets are not loaded
        $scope.book.isVerifying = true;
        var previouslyBookedDays = null;
        if (allTickets !== null && routeToRidesRemainingMap != null) {
          $scope.book.isVerifying = false;

          var ticketsByRouteId = _.groupBy(allTickets, ticket => ticket.boardStop.trip.routeId);
          if (ticketsByRouteId && ticketsByRouteId[$scope.book.routeId]) {
            previouslyBookedDays =  _.keyBy(ticketsByRouteId[$scope.book.routeId], t => new Date(t.boardStop.trip.date).getTime());
          }
          $scope.book.ridesRemaining = routeToRidesRemainingMap[$scope.book.routeId]
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
        $scope.book.ridesRemaining = null;
      }
    })

    $scope.routePassModal = $ionicModal.fromTemplate(routePassTemplate, {
      scope: $scope,
      animation: 'slide-in-up',
    });

    $scope.closeModal = () => {
      $scope.routePassModal.hide();
    }

    $scope.$watch('book.routePassChoice', (routePassChoice)=>{
      if (routePassChoice!==null) {
        $scope.book.routePassPrice = $scope.book.priceSchedules[routePassChoice].totalPrice
      }
    })

    $scope.proceed = function () {
      $scope.closeModal();
      if ($scope.book.priceSchedules[$scope.book.routePassChoice].quantity === 1) {
        $state.go('tabs.booking-summary', {routeId: $scope.book.routeId,
          boardStop: $scope.book.boardStop.id,
          alightStop: $scope.book.alightStop.id,
          sessionId: $scope.session.sessionId,
          selectedDates: $scope.book.nextTripDate,});
      } else {
        $scope.payForRoutePass()
      }
    }

    // pay for the route pass
    async function completePayment(paymentOptions) {
      try {
        $ionicLoading.show({
          template: processingPaymentsTemplate
        })
        let routePassTagList = $scope.book.route.tags.filter((tag) => {
          return tag.includes('rp-')
        })
        // assert there is no more than 1 rp- tag
        assert(routePassTagList.length === 1)
        let passValue = $scope.book.route.trips[0].price * $scope.book.priceSchedules[$scope.book.routePassChoice].quantity
        var result = await UserService.beeline({
          method: 'POST',
          url: '/transactions/route_passes/payment',
          data: _.defaults(paymentOptions, {
            creditTag: routePassTagList[0],
            promoCode: { code: '' },
            companyId: $scope.book.route.transportCompanyId,
            expectedPrice: $scope.book.routePassPrice,
            value: passValue
          }),
        });
        assert(result.status == 200);
        $scope.$emit('paymentDone');
        $ionicLoading.hide();
      } catch (err) {
        $ionicLoading.hide();
        await $ionicPopup.alert({
          title: 'Error processing payment',
          template: err.data.message,
        })
      } finally {
        RoutesService.fetchRoutePasses(true)
        RoutesService.fetchRoutePassCount()
        RoutesService.fetchRoutesWithRoutePass()
      }
    }

    // Prompts for card and processes payment with one time stripe token.
    $scope.payForRoutePass = async function() {
      try {
        // if user has credit card saved
        if ($scope.book.hasSavedPaymentInfo) {
          await completePayment({
            customerId: $scope.user.savedPaymentInfo.id,
            sourceId: _.head($scope.user.savedPaymentInfo.sources.data).id,
          });
        } else {
          var stripeToken = await loadingSpinner(StripeService.promptForToken(
            null,
            isFinite($scope.book.routePassPrice) ? $scope.book.routePassPrice * 100 : '',
            null));

          if (!stripeToken) {
            return;
          }

          //saves payment info if doesn't exist
          if ($scope.book.savePaymentChecked) {
            await loadingSpinner(UserService.savePaymentInfo(stripeToken.id))
            await completePayment({
              customerId: $scope.user.savedPaymentInfo.id,
              sourceId: _.head($scope.user.savedPaymentInfo.sources.data).id,
            });
          } else {
            await completePayment({
              stripeToken: stripeToken.id,
            });
          }
        }

      } catch (err) {
        await $ionicPopup.alert({
          title: 'Error contacting the payment gateway',
          template: err.data.message,
        })
      }
    };

    $scope.fastCheckout = async function(){
      if ($scope.book.isLoggedIn) {
        // show modal for purchasing route pass
        // if route has 'rp-' tag
        // and user has no ridesRemaining
        if (!$scope.book.ridesRemaining && $scope.book.routeSupportsRoutePass) {
          $scope.showRoutePassModal()
          $scope.$on('paymentDone', ()=>{
            $state.go('tabs.booking-summary', {routeId: $scope.book.routeId,
              boardStop: $scope.book.boardStop.id,
              alightStop: $scope.book.alightStop.id,
              sessionId: $scope.session.sessionId,
              selectedDates: $scope.book.nextTripDate,});
          })
        } else {
          $state.go('tabs.booking-summary', {routeId: $scope.book.routeId,
            boardStop: $scope.book.boardStop.id,
            alightStop: $scope.book.alightStop.id,
            sessionId: $scope.session.sessionId,
            selectedDates: $scope.book.nextTripDate,});
        }
      } else {
        UserService.promptLogIn();
      }
    }

    $scope.showRoutePassModal = async function(hideOneTicket) {
      if ($scope.book.isLoggedIn) {
        $scope.book.hasSavedPaymentInfo =  _.get($scope.user, 'savedPaymentInfo.sources.data.length', 0) > 0
        if ($scope.book.hasSavedPaymentInfo) {
          let paymentInfo = _.get($scope.user, 'savedPaymentInfo.sources.data[0]')
          $scope.book.brand = paymentInfo.brand;
          $scope.book.last4Digtis = paymentInfo.last4;
        }
        $scope.book.priceSchedules = await loadingSpinner(RoutesService.fetchPriceSchedule($scope.book.routeId))
        // priceSchedules are in order from biggest to 1 ticket
        // put default option as the biggest quantity e.g. 10-ticket route pass
        if (hideOneTicket) {
          $scope.book.priceSchedules =$scope.book.priceSchedules.slice(0, $scope.book.priceSchedules.length-1)
        }
        $scope.book.routePassChoice = 0;
        await $scope.routePassModal.show()
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

    $scope.showTermsOfUse = () => assetScopeModalService.showRoutePassTCModal();

  }
];
