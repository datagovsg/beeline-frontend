import assert from 'assert';
import processingPaymentsTemplate from '../templates/processing-payments.html';
import loadingTemplate from '../templates/loading.html';
import _ from 'lodash';
import queryString from 'querystring'

export default [
  '$scope', '$state', '$http', '$ionicPopup', 'BookingService',
  'UserService', '$ionicLoading', 'StripeService', '$stateParams',
  'RoutesService', '$ionicScrollDelegate', 'TicketService',
  'loadingSpinner', 'CreditsService',
  function ($scope, $state, $http, $ionicPopup,
    BookingService, UserService, $ionicLoading,
    StripeService, $stateParams, RoutesService, $ionicScrollDelegate, TicketService,
    loadingSpinner, CreditsService) {

    // Booking session logic
    $scope.session = {
      sessionId: +$stateParams.sessionId,
    };
    $scope.book = {
      routeId: +$stateParams.routeId,
      route: null,
      qty: 1,
      waitingForPaymentResult : false,
      selectedDates: [],
      boardStopId: parseInt($stateParams.boardStop),
      alightStopId: parseInt($stateParams.alightStop),
      boardStop: undefined,
      alightStop: undefined,
      price: undefined,
      hasInvalidDate: false,
      features: null,
      applyRouteCredits: false,
      applyReferralCredits: false,
      applyCredits: false,
      creditTag: null,
    };
    $scope.disp = {
      zeroDollarPurchase: false
    };

    if (!Array.prototype.isPrototypeOf($stateParams.selectedDates)) {
      $stateParams.selectedDates = [$stateParams.selectedDates]
    }
    $scope.book.selectedDates = $stateParams.selectedDates.map(function(item){
        return parseInt(item);
    });

    RoutesService.getRoute(parseInt($scope.book.routeId)).then((route) => {
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

    $scope.$watch(() => RoutesService.getRouteCreditTags(), async (routeToCreditTags) => {
      let creditTag = routeToCreditTags ? routeToCreditTags[$scope.book.routeId] : null
      $scope.book.applyRouteCredits = !!creditTag
      $scope.book.creditTag = creditTag
    })

    $scope.$watch(() => UserService.getUser(), (user) => {
      $scope.isLoggedIn = user ? true : false;
      $scope.user = user;
      $scope.hasSavedPaymentInfo = _.get($scope.user, 'savedPaymentInfo.sources.data.length', 0) > 0;
      $scope.book.applyReferralCredits = !!user;
      $scope.book.applyCredits = !!user;
      if ($scope.isLoggedIn) {
        loadingSpinner(Promise.all([
          $scope.checkValidDate(),
          RoutesService.fetchRouteCreditTags(),
        ]))
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
    $scope.$watch('book.price', (price) => {
      if (parseFloat(price) === 0) {
        $scope.disp.zeroDollarPurchase = true;
      }
    })

    $scope.checkValidDate = async function () {

      var previouslyBookedDays = await TicketService.getPreviouslyBookedDaysByRouteId($scope.book.routeId, true);
      var selectedAndInvalid = _.intersection(
        $scope.book.selectedDates, // list of integers
        Object.keys(previouslyBookedDays).map(s => parseInt(s))
      );
      $scope.book.hasInvalidDate = (selectedAndInvalid.length > 0)
    }

    $scope.payHandler = async function () {
      if ($scope.disp.payZeroDollar) {
        $scope.payZeroDollar();
      }
      else if ($scope.disp.savePaymentChecked) {
        $scope.payWithSavedInfo();
      }
      else {
        $scope.payWithoutSavingCard();
      }
    }

    $scope.payZeroDollar = async function () {
      if (await $ionicPopup.confirm({
        title: 'Complete Purchase',
        template: 'Are you sure you want to complete the purchase?'
      })) {
        completePayment({
          stripeToken: 'this-will-not-be-used'
        })
      }
    }

    // Prompts for card and processes payment with one time stripe token.
    $scope.payWithoutSavingCard = async function() {
      try {
        // disable the button
        $scope.waitingForPaymentResult = true;

        var stripeToken = await StripeService.promptForToken(
          null,
          isFinite($scope.book.price) ? $scope.book.price * 100 : '',
          null);

        if (!stripeToken) {
          return;
        }

        $ionicLoading.show({
          template: processingPaymentsTemplate
        })
          
        completePayment({
          stripeToken: stripeToken.id,
        });

      } catch (err) {
        await $ionicPopup.alert({
          title: 'Error contacting the payment gateway',
          template: err.data.message,
        })
      } 
    };

    // Processes payment with customer object. If customer object does not exist,
    // prompts for card, creates customer object, and proceeds as usual.
    $scope.payWithSavedInfo = async function () {
      try {
        // disable the button
        $scope.waitingForPaymentResult = true;

        if (!$scope.hasSavedPaymentInfo) {
          var stripeToken = await StripeService.promptForToken(
            null,
            isFinite($scope.book.price) ? $scope.book.price * 100 : '',
            null);

          if (!stripeToken) {
            return;
          }
        }

        //saves payment info if doesn't exist
        if (!$scope.hasSavedPaymentInfo) {
          await loadingSpinner(UserService.savePaymentInfo(stripeToken.id))
        }

        completePayment({
          customerId: $scope.user.savedPaymentInfo.id,
          sourceId: _.head($scope.user.savedPaymentInfo.sources.data).id,
        });
      } catch (err) {
        await $ionicPopup.alert({
          title: 'Error saving payment method',
          template: err.data.message,
        })
      }
    };

    /** After you have settled the payment mode **/
    async function completePayment(paymentOptions) {
      try {
        $ionicLoading.show({
          template: processingPaymentsTemplate
        })

        var result = await UserService.beeline({
          method: 'POST',
          url: '/transactions/payment_ticket_sale',
          data: _.defaults(paymentOptions, {
            trips: BookingService.prepareTrips($scope.book),
            promoCode: $scope.book.promoCode ? { code: $scope.book.promoCode } : null,
            creditTag: $scope.book.creditTag,
            applyCredits: $scope.book.applyCredits,
            applyReferralCredits: $scope.book.applyReferralCredits,
          }),
        });

        assert(result.status == 200);

        $ionicLoading.hide();

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
        RoutesService.fetchRouteCredits(true)
        RoutesService.fetchRoutePassCount()
        RoutesService.fetchRoutesWithRoutePass() 

        CreditsService.fetchReferralCredits(true);
        CreditsService.fetchUserCredits(true);
      }
    }
  },
];
