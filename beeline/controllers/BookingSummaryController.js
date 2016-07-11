import assert from 'assert';
import processingPaymentsTemplate from '../templates/processing-payments.html';

export default [
  '$scope', '$state', '$http', '$ionicPopup', 'BookingService',
  'UserService', '$ionicLoading', 'StripeService', '$stateParams',
  'RoutesService', '$ionicScrollDelegate',
  function ($scope, $state, $http, $ionicPopup,
    BookingService, UserService, $ionicLoading,
    StripeService, $stateParams, RoutesService, $ionicScrollDelegate) {

    $scope.book = {
      routeId: '',
      route: null,
      qty: 1,
      waitingForPaymentResult : false,
      promoCodes: [],
      currentPromoCode: undefined,
      selectedDates: [],
      boardStopId: undefined,
      alightStopId: undefined,
      boardStop: undefined,
      alightStop: undefined,
      price: undefined,
    };
    $scope.disp = {};

    $scope.$on('$ionicView.beforeEnter', () => {
      $scope.book.routeId = $stateParams.routeId;
      if (!Array.prototype.isPrototypeOf($stateParams.selectedDates)) {
        $stateParams.selectedDates = [$stateParams.selectedDates]
      }
      $scope.book.selectedDates = $stateParams.selectedDates.map(function(item){
          return parseInt(item);
      });
      $scope.book.boardStopId  = parseInt($stateParams.boardStop);
      $scope.book.alightStopId = parseInt($stateParams.alightStop);
      RoutesService.getRoute(parseInt($scope.book.routeId))
      .then((route) => {
        $scope.book.route = route;
        $scope.book.boardStop = route.tripsByDate[$scope.book.selectedDates[0]]
              .tripStops
              .filter(ts => $scope.book.boardStopId == ts.stop.id)[0];
        $scope.book.alightStop = route.tripsByDate[$scope.book.selectedDates[0]]
              .tripStops
              .filter(ts => $scope.book.alightStopId == ts.stop.id)[0]
      });
    });

    $scope.addPromoCode = function() {
      $scope.book.promoCodes.push($scope.book.currentPromoCode);
    }

    $scope.$watch(() => UserService.getUser(), (user) => {
      $scope.isLoggedIn = user ? true : false;
    })

    $scope.login = function () {
      UserService.promptLogIn()
    }

    $scope.$on('priceCalculator.done', () => {
      $ionicScrollDelegate.resize();
    })

    // methods
    $scope.pay = async function() {
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
              isFinite($scope.book.price) ? $scope.book.price * 100 : '');
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
          url: '/transactions/payment_ticket_sale',
          data: {
            stripeToken: stripeToken.id,
            trips: BookingService.prepareTrips($scope.book),
          },
        });
        $ionicLoading.hide();

        // This gives us the transaction items
        assert(result.status == 200);

        $state.go('tabs.booking-confirmation');
      } catch (err) {
        $ionicLoading.hide();
        await $ionicPopup.alert({
          title: 'Error processing payment',
          template: err.data.message,
        })
      } finally {
        $scope.$apply(() => {
          $scope.waitingForPaymentResult = false;
        })
      }
    };
  },
];
