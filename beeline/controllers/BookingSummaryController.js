import _ from "lodash"

export default [
  "$document",
  "$scope",
  "$ionicPopup",
  "BookingService",
  "PaymentService",
  "UserService",
  "RequestService",
  "StripeService",
  "$stateParams",
  "RoutesService",
  "$ionicScrollDelegate",
  "TicketService",
  "loadingSpinner",
  "CreditsService",
  "$ionicPosition",
  function(
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
    CreditsService,
    $ionicPosition
  ) {
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
      applyReferralCredits: false,
      applyCredits: false,
      creditTag: null,
      promoCode: null,
      promoCodeEntered: null,
      feedback: null,
      promoCodeIsValid: null,
      isVerifying: null,
      selectedDates: ($stateParams.selectedDates || "")
        .split(",")
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
      $scope.book.boardStop = route.tripsByDate[
        $scope.book.selectedDates[0]
      ].tripStops.filter(ts => $scope.book.boardStopId === ts.stop.id)[0]
      $scope.book.alightStop = route.tripsByDate[
        $scope.book.selectedDates[0]
      ].tripStops.filter(ts => $scope.book.alightStopId === ts.stop.id)[0]
    })

    RoutesService.getRouteFeatures(routeId).then(features => {
      $scope.book.features = features
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
          _.get($scope.user, "savedPaymentInfo.sources.data.length", 0) > 0
        $scope.book.applyReferralCredits = Boolean(user)
        $scope.book.applyCredits = Boolean(user)
        if ($scope.isLoggedIn) {
          loadingSpinner($scope.checkValidDate())
        }
      }
    )

    $scope.$on("priceCalculator.done", () => {
      $ionicScrollDelegate.resize()
      $scope.isPreviewCalculating = false
      $scope.$broadcast("scroll.refreshComplete")
    })

    $scope.$on("companyTnc.done", () => {
      $ionicScrollDelegate.resize()
    })

    $scope.$watch("book.price", price => {
      if (parseFloat(price) === 0) {
        $scope.disp.zeroDollarPurchase = true
      } else {
        $scope.disp.zeroDollarPurchase = false
      }
    })

    $scope.$watch(
      "book.promoCodeEntered",
      _.debounce(verifyPromoCode, 800, { leading: false, trailing: true })
    )

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.login = function() {
      $scope.isPreviewCalculating = true
      UserService.promptLogIn()
      $scope.scrollToPriceCalculator()
    }

    $scope.checkValidDate = async function() {
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

    $scope.refreshPrices = function() {
      $scope.$broadcast("priceCalculator.recomputePrices")
    }

    $scope.payHandler = async function() {
      $scope.isPaymentProcessing = true

      await PaymentService.payHandler(
        $scope.book,
        $scope.disp.savePaymentChecked
      )

      $scope.isPaymentProcessing = false
    }

    $scope.scrollToPriceCalculator = function() {
      const priceCalculatorPosition = $ionicPosition.position(
        angular.element($document.getElementById("priceCalc"))
      )
      $ionicScrollDelegate.scrollTo(
        priceCalculatorPosition.left,
        priceCalculatorPosition.top,
        true
      )
    }

    $scope.promptPromoCode = async function() {
      if ($scope.isLoggedIn) {
        $scope.enterPromoCodePopup = $ionicPopup.show({
          scope: $scope,
          template: `
            <label>
              <input type="text"
                    style="text-transform: uppercase"
                    placeholder="PROMOCODE"
                    ng-model="book.promoCodeEntered">
              </input>
            </label>
            <div class="text-center">
              <ion-spinner ng-show="book.isVerifying"></ion-spinner>
            </div>
            <div class="text-center"> {{book.feedback}}</div>
          `,
          title: "Enter Promo Code",
          buttons: [
            {
              text: "Close",
              onTap: function(e) {
                $scope.book.feedback = null
                $scope.book.promoCodeEntered = null
              },
            },
            {
              text: "Apply",
              type: "button-positive",
              onTap: function(e) {
                e.preventDefault()
                if ($scope.book.promoCodeIsValid) {
                  $scope.book.promoCode = $scope.book.promoCodeEntered.toUpperCase()
                  $scope.book.feedback = $scope.book.promoCodeEntered = null
                  $scope.enterPromoCodePopup.close()
                }
              },
            },
          ],
        })
      } else {
        await $ionicPopup.alert({
          title: "You need to log in before enter any promo code",
        })
        $scope.login()
      }
    }

    // ------------------------------------------------------------------------
    // Helper functions
    // ------------------------------------------------------------------------
    function verifyPromoCode() {
      if (
        $scope.book.promoCodeEntered === null ||
        !$scope.book.promoCodeEntered
      ) {
        $scope.book.feedback = $scope.book.promoCodeEntered = $scope.book.promoCodeIsValid = null
        $scope.$digest()
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
            $scope.book.feedback = "Valid"
            $scope.book.promoCodeIsValid = true
          }
        })
        .catch(error => {
          // still need this check as the latter promise may come back
          //  earlier than the 1st one
          if (
            currentVerifyPromoCodePromise ===
            $scope.book.lastestVerifyPromoCodePromise
          ) {
            if (error.data && error.data.source === "promoCode") {
              $scope.book.feedback = error.data.message || "Invalid"
              $scope.book.promoCodeIsValid = null
            } else {
              $scope.book.feedback = "Valid"
              $scope.book.promoCodeIsValid = true
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
  },
]
