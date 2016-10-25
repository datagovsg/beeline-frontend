import assert from 'assert';
import processingPaymentsTemplate from '../templates/processing-payments.html';
import loadingTemplate from '../templates/loading.html';
import _ from 'lodash';

export default [
  '$scope', '$state', '$http', '$ionicPopup', 'BookingService',
  'UserService', '$ionicLoading', 'StripeService', '$stateParams',
  'RoutesService', '$ionicScrollDelegate', 'TicketService',
  function ($scope, $state, $http, $ionicPopup,
    BookingService, UserService, $ionicLoading,
    StripeService, $stateParams, RoutesService, $ionicScrollDelegate, TicketService) {

    // Booking session logic
    $scope.session = {
      sessionId: null,
    };
    $scope.book = {
      routeId: null,
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
      hasInvalidDate: false,
      features: null,
    };
    $scope.disp = {};

    $scope.book.routeId = +$stateParams.routeId;
    $scope.session.sessionId = +$stateParams.sessionId;

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
            .filter(ts => $scope.book.alightStopId == ts.stop.id)[0];
    });
    RoutesService.getRouteFeatures(parseInt($scope.book.routeId))
    .then((features)=>{
      $scope.book.features = features;
    })

    $scope.addPromoCode = function() {
      $scope.book.promoCodes.push($scope.book.currentPromoCode);
    }

    $scope.$watch(() => UserService.getUser(), async(user) => {
      $scope.isLoggedIn = user ? true : false;
      if ($scope.isLoggedIn) {
        $ionicLoading.show({
          template: loadingTemplate
        })
        await $scope.checkValidDate();
        $ionicLoading.hide();
      }
    })

    $scope.login = function () {
      UserService.promptLogIn()
    }

    $scope.$on('priceCalculator.done', () => {
      $ionicScrollDelegate.resize();
    })
    $scope.$on('companyTnc.done', () => {
      $ionicScrollDelegate.resize();
    })

    $scope.checkValidDate = async function () {

      var previouslyBookedDays = await TicketService.getPreviouslyBookedDaysByRouteId($scope.book.routeId, true);
      var selectedAndInvalid = _.intersection(
        $scope.book.selectedDates, // list of integers
        Object.keys(previouslyBookedDays).map(s => parseInt(s))
      );
      $scope.book.hasInvalidDate = (selectedAndInvalid.length > 0)
    }

    // methods
    $scope.pay = async function() {
      try {
        // disable the button
        $scope.waitingForPaymentResult = true;

        const stripeToken = await StripeService.promptForToken();

        if (!stripeToken) return;

        // TODO: After stripeToken is received, check disp.savePaymentChecked,
        // if true: call UserService.savePaymentInfo(stripeToken.id)
        if ($scope.disp.savePaymentChecked) {
          await UserService.savePaymentInfo(stripeToken.id);
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

        // TODO: put need-to-refresh logic into service
        TicketService.setShouldRefreshTickets();

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
