import _ from 'lodash'
import { htmlFrom } from '../shared/util'

export default [
  '$document',
  '$scope',
  '$ionicPopup',
  'BookingService',
  'PaymentService',
  'UserService',
  'RequestService',
  'StripeService',
  '$stateParams',
  'RoutesService',
  '$ionicScrollDelegate',
  'TicketService',
  'loadingSpinner',
  '$ionicPosition',
  function (
    $document,
    $scope,
    $ionicPopup,
    BookingService,
    PaymentService,
    UserService,
    RequestService,
    StripeService,
    $stateParams,
    RoutesService,
    $ionicScrollDelegate,
    TicketService,
    loadingSpinner,
    $ionicPosition
  ) {
    // ------------------------------------------------------------------------
    // Helper functions
    // ------------------------------------------------------------------------
    const verifyPromoCode = function verifyPromoCode () {
      if (
        $scope.book.promoCodeEntered === null ||
        !$scope.book.promoCodeEntered
      ) {
        $scope.book.feedback = $scope.book.promoCodeEntered = null
        $scope.$digest()
        return
      }
      if ($scope.book.promoCode !== null) {
        $scope.book.feedback =
          'Sorry, only one promo code can be applied at one time. Please remove the promo code below to proceed'
        return
      }
      if ($scope.book.price === 0) {
        $scope.book.feedback =
          'Sorry, no promo code can be applied because there is nothing to pay for'
        return
      }
      let bookClone = _.cloneDeep($scope.book)
      let book = _.assign(bookClone, {
        promoCode: $scope.book.promoCodeEntered.toUpperCase(),
      })
      $scope.book.isVerifying = true
      const currentVerifyPromoCodePromise = ($scope.book.lastestVerifyPromoCodePromise = BookingService.computePriceInfo(
        book
      )
        .then(priceInfo => {
          if (
            currentVerifyPromoCodePromise ===
            $scope.book.lastestVerifyPromoCodePromise
          ) {
            $scope.book.feedback = '' // if valid, no feedback required
            $scope.book.promoCode = $scope.book.promoCodeEntered.toUpperCase()
            $scope.book.promoCodeEntered = null
          }
        })
        .catch(error => {
          // still need this check as the latter promise may come back
          //  earlier than the 1st one
          if (
            currentVerifyPromoCodePromise ===
            $scope.book.lastestVerifyPromoCodePromise
          ) {
            if (error.data && error.data.source === 'promoCode') {
              $scope.book.feedback = error.data.message || 'Invalid'
            } else {
              $scope.book.feedback = '' // if valid, no feedback required
              $scope.book.promoCode = $scope.book.promoCodeEntered.toUpperCase()
              $scope.book.promoCodeEntered = null
            }
          }
        })
        .finally(() => {
          if (
            currentVerifyPromoCodePromise ===
            $scope.book.lastestVerifyPromoCodePromise
          ) {
            $scope.book.isVerifying = null
          }
        }))
    }

    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let routeId = $stateParams.routeId ? Number($stateParams.routeId) : null
    let boardStop = $stateParams.boardStop
      ? Number($stateParams.boardStop)
      : null
    let alightStop = $stateParams.alightStop
      ? Number($stateParams.alightStop)
      : null

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.book = {
      routeId,
      route: null,
      qty: 1,
      boardStopId: boardStop,
      alightStopId: alightStop,
      boardStop: undefined,
      alightStop: undefined,
      price: undefined,
      hasInvalidDate: false,
      features: null,
      applyRoutePass: false,
      promoCode: null,
      promoCodeEntered: null,
      feedback: null,
      isVerifying: null,
      selectedDates: ($stateParams.selectedDates || '')
        .split(',')
        .map(s => parseInt(s)),
      // if 2 requests sent to verify promo code, only the latter matters
      // always need to have this if using debounce with promise
      lastestVerifyPromoCodePromise: null,
      hasSavedPaymentInfo: null,
    }
    $scope.disp = {
      zeroDollarPurchase: false,
    }

    $scope.isPaymentProcessing = false

    // ------------------------------------------------------------------------
    // Data Loading
    // ------------------------------------------------------------------------
    RoutesService.getRoute(routeId).then(route => {
      $scope.book.route = route
      $scope.book.boardStop = route.tripsByDate[$scope.book.selectedDates[0]].tripStops.filter(ts => $scope.book.boardStopId === ts.stop.id)[0]
      $scope.book.alightStop = route.tripsByDate[$scope.book.selectedDates[0]].tripStops.filter(ts => $scope.book.alightStopId === ts.stop.id)[0]
      $scope.book.features = htmlFrom(route.features)
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch(
      () => UserService.getUser(),
      user => {
        $scope.isLoggedIn = Boolean(user)
        $scope.user = user
        $scope.book.hasSavedPaymentInfo =
          _.get($scope.user, 'savedPaymentInfo.sources.data.length', 0) > 0
        if ($scope.isLoggedIn) {
          loadingSpinner($scope.checkValidDate())
        }
      }
    )

    $scope.$on('priceCalculator.done', () => {
      $ionicScrollDelegate.resize()
      $scope.isPreviewCalculating = false
      $scope.$broadcast('scroll.refreshComplete')
    })

    $scope.$on('companyTnc.done', () => {
      $ionicScrollDelegate.resize()
    })

    $scope.$watch('book.price', price => {
      if (parseFloat(price) === 0) {
        $scope.disp.zeroDollarPurchase = true
      } else {
        $scope.disp.zeroDollarPurchase = false
      }
    })

    $scope.$watch('book.promoCodeEntered', () => {
      $scope.book.feedback = ''
    })

    $scope.$watch('book.promoCode', () => {
      if (!$scope.book.promoCode) {
        $scope.book.feedback = ''
      }
    })

    $scope.$watch('book.applyRoutePass', () => {
      // Remove promo code every time we toggle apply route pass
      $scope.book.promoCodeEntered = null
      $scope.book.promoCode = null
    })

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.login = async function () {
      let user = await UserService.promptLogIn()

      if (user) {
        // Recalculate prices because user might be whitelisted OR have route
        // passes
        $scope.isPreviewCalculating = true
        $scope.refreshPrices()
        $scope.scrollToPriceCalculator()
      }
    }

    $scope.checkValidDate = async function () {
      const previouslyBookedDays = await TicketService.fetchPreviouslyBookedDaysByRouteId(
        routeId,
        true
      )
      const selectedAndInvalid = _.intersection(
        $scope.book.selectedDates, // list of integers
        Object.keys(previouslyBookedDays).map(s => parseInt(s))
      )
      $scope.book.hasInvalidDate = selectedAndInvalid.length > 0
    }

    $scope.refreshPrices = function () {
      $scope.$broadcast('priceCalculator.recomputePrices')
    }

    $scope.payHandler = async function (onetimePayment) {
      onetimePayment = !!onetimePayment
      $scope.isPaymentProcessing = true
      await PaymentService.payHandler(
        $scope.book,
        $scope.disp.savePaymentChecked,
        onetimePayment
      )
      $scope.isPaymentProcessing = false
      $scope.$digest()
    }

    $scope.scrollToPriceCalculator = function () {
      const priceCalculatorPosition = $ionicPosition.position(
        angular.element($document[0].getElementById('priceCalc'))
      )

      $ionicScrollDelegate.scrollTo(
        priceCalculatorPosition.left,
        priceCalculatorPosition.top,
        true
      )
    }

    $scope.enterPromoCode = function () {
      verifyPromoCode()
    }
  },
]
