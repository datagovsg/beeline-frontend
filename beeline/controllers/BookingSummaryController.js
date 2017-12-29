import assert from "assert"
import processingPaymentsTemplate from "../templates/processing-payments.html"
import onlyOneAtATime from "../util"
import _ from "lodash"

export default [
  "$document",
  "$scope",
  "$state",
  "$ionicPopup",
  "BookingService",
  "UserService",
  "$ionicLoading",
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
    $state,
    $ionicPopup,
    BookingService,
    UserService,
    $ionicLoading,
    StripeService,
    $stateParams,
    RoutesService,
    $ionicScrollDelegate,
    TicketService,
    loadingSpinner,
    CreditsService,
    $ionicPosition
  ) {
    // Booking session logic
    $scope.session = {
      sessionId: Number($stateParams.sessionId),
    }
    $scope.book = {
      routeId: Number($stateParams.routeId),
      route: null,
      qty: 1,
      boardStopId: parseInt($stateParams.boardStop),
      alightStopId: parseInt($stateParams.alightStop),
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
    }
    $scope.disp = {
      zeroDollarPurchase: false,
    }

    $scope.isPaymentProcessing = false

    RoutesService.getRoute(parseInt($scope.book.routeId)).then(route => {
      $scope.book.route = route
      $scope.book.boardStop = route.tripsByDate[
        $scope.book.selectedDates[0]
      ].tripStops.filter(ts => $scope.book.boardStopId === ts.stop.id)[0]
      $scope.book.alightStop = route.tripsByDate[
        $scope.book.selectedDates[0]
      ].tripStops.filter(ts => $scope.book.alightStopId === ts.stop.id)[0]
    })

    RoutesService.getRouteFeatures(parseInt($scope.book.routeId)).then(
      features => {
        $scope.book.features = features
      }
    )

    $scope.$watch(
      () => UserService.getUser(),
      user => {
        $scope.isLoggedIn = Boolean(user)
        $scope.user = user
        $scope.hasSavedPaymentInfo =
          _.get($scope.user, "savedPaymentInfo.sources.data.length", 0) > 0
        $scope.book.applyReferralCredits = Boolean(user)
        $scope.book.applyCredits = Boolean(user)
        if ($scope.isLoggedIn) {
          loadingSpinner($scope.checkValidDate())
        }
      }
    )

    $scope.login = function() {
      $scope.isPreviewCalculating = true
      UserService.promptLogIn()
      $scope.scrollToPriceCalculator()
    }

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

    $scope.checkValidDate = async function() {
      const previouslyBookedDays = await TicketService.fetchPreviouslyBookedDaysByRouteId(
        $scope.book.routeId,
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
      if ($scope.disp.payZeroDollar) {
        $scope.payZeroDollar()
      } else if ($scope.disp.savePaymentChecked) {
        $scope.payWithSavedInfo()
      } else {
        $scope.payWithoutSavingCard()
      }
    }

    $scope.payZeroDollar = onlyOneAtATime(
      async function() {
        if (
          await $ionicPopup.confirm({
            title: "Complete Purchase",
            template: "Are you sure you want to complete the purchase?",
          })
        ) {
          await completePayment({
            stripeToken: "this-will-not-be-used",
          })
        }
      },
      { scope: $scope, indicatorVariable: "isPaymentProcessing" }
    )

    // Prompts for card and processes payment with one time stripe token.
    $scope.payWithoutSavingCard = onlyOneAtATime(
      async function() {
        try {
          const stripeToken = await StripeService.promptForToken(
            null,
            isFinite($scope.book.price) ? $scope.book.price * 100 : "",
            null
          )

          if (!stripeToken) {
            return
          }

          await completePayment({
            stripeToken: stripeToken.id,
          })
        } catch (err) {
          await $ionicPopup.alert({
            title: "Error contacting the payment gateway",
            template: err.data.message,
          })
        }
      },
      { scope: $scope, indicatorVariable: "isPaymentProcessing" }
    )

    // Processes payment with customer object.
    // If customer object does not exist, prompts for card,
    // creates customer object, and proceeds as usual.
    $scope.payWithSavedInfo = onlyOneAtATime(
      async function() {
        try {
          if (!$scope.hasSavedPaymentInfo) {
            let stripeToken = await StripeService.promptForToken(
              null,
              isFinite($scope.book.price) ? $scope.book.price * 100 : "",
              null
            )
            await loadingSpinner(UserService.savePaymentInfo(stripeToken.id))
          }

          await completePayment({
            customerId: $scope.user.savedPaymentInfo.id,
            sourceId: _.head($scope.user.savedPaymentInfo.sources.data).id,
          })
        } catch (err) {
          await $ionicPopup.alert({
            title: "Error saving payment method",
            template: err.data.message,
          })
        }
      },
      { scope: $scope, indicatorVariable: "isPaymentProcessing" }
    )

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

    // After you have settled the payment mode
    async function completePayment(paymentOptions) {
      try {
        $ionicLoading.show({
          template: processingPaymentsTemplate,
        })

        const result = await UserService.beeline({
          method: "POST",
          url: "/transactions/tickets/payment",
          data: _.defaults(paymentOptions, {
            trips: BookingService.prepareTrips($scope.book),
            promoCode: $scope.book.promoCode
              ? { code: $scope.book.promoCode }
              : { code: "" },
            applyRoutePass: Boolean($scope.book.applyRoutePass),
            applyCredits: $scope.book.applyCredits,
            applyReferralCredits: $scope.book.applyReferralCredits,
            expectedPrice: $scope.book.price,
          }),
        })

        assert(result.status === 200)

        $ionicLoading.hide()

        TicketService.setShouldRefreshTickets()
        $state.go("tabs.route-confirmation")
      } catch (err) {
        $ionicLoading.hide()
        await $ionicPopup.alert({
          title: "Error processing payment",
          template: err.data.message,
        })
      } finally {
        RoutesService.fetchRoutePasses(true)
        RoutesService.fetchRoutePassCount()
        RoutesService.fetchRoutesWithRoutePass()

        CreditsService.fetchReferralCredits(true)
        CreditsService.fetchUserCredits(true)
      }
    }

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

    $scope.$watch(
      "book.promoCodeEntered",
      _.debounce(verifyPromoCode, 800, { leading: false, trailing: true })
    )

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
  },
]
