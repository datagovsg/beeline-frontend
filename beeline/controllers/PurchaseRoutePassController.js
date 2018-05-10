import _ from "lodash"
import { htmlFrom } from "../shared/util"

export default [
  "$ionicHistory",
  "$ionicPopup",
  "$scope",
  "$stateParams",
  "loadingSpinner",
  "PaymentService",
  "RequestService",
  "RoutesService",
  "StripeService",
  "UserService",
  function(
    $ionicHistory,
    $ionicPopup,
    $scope,
    $stateParams,
    loadingSpinner,
    PaymentService,
    RequestService,
    RoutesService,
    StripeService,
    UserService
  ) {
    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------
    const retrievePaymentInfo = async function retrievePaymentInfo() {
      let paymentInfo
      // if user has credit card saved
      if ($scope.book.hasSavedPaymentInfo) {
        paymentInfo = {
          customerId: $scope.book.savedPaymentInfo.id,
          sourceId: _.head($scope.book.savedPaymentInfo.sources.data).id,
        }
      } else {
        const stripeToken = await loadingSpinner(
          StripeService.promptForToken(
            null,
            isFinite($scope.book.routePassPrice)
              ? $scope.book.routePassPrice * 100
              : "",
            null
          )
        )

        if (stripeToken) {
          // saves payment info if doesn't exist
          if ($scope.book.savePaymentChecked) {
            await UserService.savePaymentInfo(stripeToken.id)
            const user = await UserService.getUser()
            paymentInfo = {
              customerId: user.savedPaymentInfo.id,
              sourceId: _.head(user.savedPaymentInfo.sources.data).id,
            }
          } else {
            paymentInfo = { stripeToken: stripeToken.id }
          }
        }
      }
      return paymentInfo
    }

    const payForRoutePass = async function payForRoutePass() {
      try {
        const paymentInfo = await retrievePaymentInfo()
        const {
          totalPrice: expectedPrice,
          quantity,
        } = $scope.book.priceSchedules[$scope.book.routePassChoice]

        return paymentInfo
          ? PaymentService.payForRoutePass(
              $scope.data.route,
              expectedPrice,
              quantity,
              paymentInfo
            )
          : new Promise((resolve, reject) => {
              return reject("No payment information available")
            })
      } catch (err) {
        console.error(err)
        return new Promise((resolve, reject) => {
          return reject("routePassError")
        })
      }
    }

    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let routeId = $stateParams.routeId ? Number($stateParams.routeId) : null

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.book = {
      priceSchedules: null,
      routePassPrice: null,
      routePassChoice: null,
      hasSavedPaymentInfo: false,
      savedPaymentInfo: null,
      brand: null,
      last4Digits: null,
      user: UserService.getUser(),
      isProcessing: null,
    }

    $scope.data = {
      route: null,
    }

    $scope.routePassTerms = {}

    RoutesService.getRoute(routeId, true).then(route => {
      $scope.data.route = route
    })

    RoutesService.fetchPriceSchedule(routeId).then(response => {
      // Filter out the schedule with only one pass
      response = _.filter(response, schedule => schedule.quantity !== 1)
      $scope.book.priceSchedules = _.sortBy(response, ["unitPrice"])
      $scope.book.routePassChoice = 0
    })

    RequestService.beeline({
      method: "GET",
      url: "/assets/routepass-tc",
    })
      .then(response => {
        $scope.routePassTerms.html = htmlFrom(response.data.data)
        $scope.routePassTerms.error = undefined
      })
      .catch(error => {
        $scope.routePassTerms.error = error
        console.error(error)
      })

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.login = async function() {
      // Prompt login
      let user = await UserService.loginIfNeeded()
      let hasSavedPaymentInfo =
        _.get(user, "savedPaymentInfo.sources.data.length", 0) > 0
      $scope.book.hasSavedPaymentInfo = hasSavedPaymentInfo
      let savedPaymentInfo = $scope.book.hasSavedPaymentInfo
        ? _.get(user, "savedPaymentInfo")
        : null
      $scope.book.savedPaymentInfo = savedPaymentInfo
      $scope.book.brand = hasSavedPaymentInfo
        ? savedPaymentInfo.sources.data[0].brand
        : null
      $scope.book.last4Digits = hasSavedPaymentInfo
        ? savedPaymentInfo.sources.data[0].last4
        : null
    }

    $scope.proceed = async function() {
      $scope.book.isProcessing = true
      loadingSpinner(payForRoutePass()).then(
        async () => {
          $scope.book.isProcessing = false
          await $ionicPopup.alert({
            title: "Route pass purchase successful!",
          })
          $ionicHistory.goBack()
          return "Payment Done"
        },
        async () => {
          $scope.book.isProcessing = false
          await $ionicPopup.alert({
            title: "Route pass purchase unsuccessful",
          })
          return "Payment Failed"
        }
      )
    }

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch("book.routePassChoice", choice => {
      if (choice !== null) {
        $scope.book.routePassPrice = $scope.book.priceSchedules[choice].price
      }
    })

    UserService.userEvents.on("userChanged", () => {
      $scope.book.user = UserService.getUser()
    })
  },
]
