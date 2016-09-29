import {NetworkError} from '../shared/errors';
import {formatDate, formatTime, formatUTCDate, formatHHMM_ampm} from '../shared/format';
import loadingTemplate from '../templates/loading.html';
import processingPaymentsTemplate from '../templates/processing-payments.html';

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
  'uiGmapGoogleMapApi',
  'MapOptions',
  'loadingSpinner',
  'UserService',
  'StripeService',
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
    uiGmapGoogleMapApi,
    MapOptions,
    loadingSpinner,
    UserService,
    StripeService
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
      bid: null,
      calculatedAmount: '',
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

    var routePromise;

    $scope.book.routeId = +$stateParams.routeId;

    routePromise = RoutesService.getRoute($scope.book.routeId);

    var stopOptions = {
      initialBoardStopId: $stateParams.boardStop ? parseInt($stateParams.boardStop) : undefined,
      initialAlightStopId: $stateParams.alightStop ? parseInt($stateParams.alightStop) : undefined,
    };
    routePromise.then((route) => {
      $scope.book.route = route;
      $scope.book.bidOptions = $scope.book.route.notes.tier;
      computeStops(stopOptions);
    });

    $scope.$on('$ionicView.afterEnter', () => {
      loadingSpinner(Promise.all([gmapIsReady, routePromise])
      .then(() => {
        var gmap = $scope.map.control.getGMap();
        google.maps.event.trigger(gmap, 'resize');
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

    $scope.$watch(() => UserService.getUser(), async(user) => {
      $scope.isLoggedIn = user ? true : false;
      $scope.user = user;
    })

    $scope.login = function () {
      UserService.promptLogIn()
    }

    $scope.$watch('book.bid',(bid)=>{
      if ($scope.book.route && $scope.book.route.notes &&  $scope.book.route.notes.tier) {
        console.log(bid);
        $scope.book.calculatedAmount = $scope.book.route.notes.tier[bid].price * 5;
        console.log($scope.book.calculatedAmount);
      }
    })

    $scope.createBid = async function(){
      try {
        // disable the button
        $scope.waitingForPaymentResult = true;

        if (window.CardIO) {
          var cardDetails = await new Promise((resolve, reject) => CardIO.scan({
            "expiry": true,
            "cvv": true,
            "zip": false,
            "suppressManual": false,
            "suppressConfirm": false,
            "hideLogo": true
          }, resolve, () => resolve(null)));

          if (cardDetails == null) return;

          var stripeToken = await new Promise((resolve, reject) => Stripe.createToken({
            number:     cardDetails["card_number"],
            cvc:        cardDetails["cvv"],
            exp_month:  cardDetails["expiry_month"],
            exp_year:   cardDetails["expiry_year"],
          }, (statusCode, response) => {
            if (response.error)
              reject(response.error.message);
            else
              resolve(response);
          }));
        }
        else if (StripeService.loaded) { // Use Stripe Checkout
          var stripeToken = await StripeService.promptForToken(
              undefined, /* description */
              isFinite($scope.book.calculatedAmount) ? $scope.book.calculatedAmount * 100 : '');
          if (stripeToken == null)
            return;
        }
        else { // Last resort :(
          throw new Error("There was some difficulty contacting the payment gateway." +
            " Please check your Internet connection");
        }

        if (!('id' in stripeToken)) {
          alert("There was an error contacting Stripe");
          return;
        }

        $ionicLoading.show({
          template: processingPaymentsTemplate
        })
        var result = await UserService.beeline({
          method: 'POST',
          url: '/users/$scope.user.id/creditCards',
          data: {
            stripeToken: stripeToken.id
          },
        });
        $ionicLoading.hide();

        // This gives us the transaction items
        assert(result.status == 200);

        //TODO post lelong bid
      } catch (err) {
        $ionicLoading.hide();
        await $ionicPopup.alert({
          title: 'Error processing payment',
          template: err.data.message,
        })
      }finally {
        $scope.$apply(() => {
          $scope.waitingForPaymentResult = false;
        })
      }
    }
  }
];
