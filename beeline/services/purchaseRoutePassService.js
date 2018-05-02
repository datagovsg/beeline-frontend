/* eslint-disable require-jsdoc */
import routePassTemplate from "../templates/route-pass-modal.html"
import { htmlFrom } from "../shared/util"
import _ from "lodash"

angular.module("beeline").service("purchaseRoutePassService", [
  "$rootScope",
  "$ionicModal",
  "RoutesService",
  "loadingSpinner",
  "StripeService",
  "PaymentService",
  "UserService",
  "RequestService",
  "$state",
  function PurchaseRoutePassService(
    $rootScope,
    $ionicModal,
    RoutesService,
    loadingSpinner,
    StripeService,
    PaymentService,
    UserService,
    RequestService,
    $state
  ) {
    let self = this
    self.show = (
      hideOneTicket,
      route,
      routeId,
      hasSavedPaymentInfo,
      savedPaymentInfo,
      boardStopId,
      alightStopId,
      selectedDates
    ) => {
      let scope = $rootScope.$new()
      let routePassModal = $ionicModal.fromTemplate(routePassTemplate, {
        scope: scope,
        animation: "slide-in-up",
      })

      scope.book = {
        priceSchedules: null,
        routePassPrice: null,
        routePassChoice: null,
        hasSavedPaymentInfo: hasSavedPaymentInfo,
        brand: hasSavedPaymentInfo
          ? savedPaymentInfo.sources.data[0].brand
          : null,
        last4Digits: hasSavedPaymentInfo
          ? savedPaymentInfo.sources.data[0].last4
          : null,
        isProcessing: null,
      }

      scope.$watch("book.routePassChoice", choice => {
        if (choice !== null) {
          scope.book.routePassPrice =
            scope.book.priceSchedules[choice].totalPrice
        }
      })

      const retrievePaymentInfo = async function retrievePaymentInfo() {
        let paymentInfo
        // if user has credit card saved
        if (hasSavedPaymentInfo) {
          paymentInfo = {
            customerId: savedPaymentInfo.id,
            sourceId: _.head(savedPaymentInfo.sources.data).id,
          }
        } else {
          const stripeToken = await loadingSpinner(
            StripeService.promptForToken(
              null,
              isFinite(scope.book.routePassPrice)
                ? scope.book.routePassPrice * 100
                : "",
              null
            )
          )

          if (stripeToken) {
            // saves payment info if doesn't exist
            if (scope.book.savePaymentChecked) {
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

      // Prompts for card and processes payment with one time stripe token.
      scope.payForRoutePass = async function() {
        try {
          const paymentInfo = await retrievePaymentInfo()
          const {
            totalPrice: expectedPrice,
            quantity,
          } = scope.book.priceSchedules[scope.book.routePassChoice]

          return paymentInfo
            ? new Promise((resolve, reject) => {
                return reject("No payment information available")
              })
            : PaymentService.payForRoutePass(
                route,
                expectedPrice,
                quantity,
                paymentInfo
              )
        } catch (err) {
          console.error(err)
          return new Promise((resolve, reject) => {
            return reject("routePassError")
          })
        }
      }

      let purchaseRoutePassPromise = loadingSpinner(
        RoutesService.fetchPriceSchedule(routeId)
      ).then(response => {
        return new Promise((resolve, reject) => {
          scope.book.priceSchedules = response
          scope.book.routePassChoice = 0
          scope.book.isProcessing = false
          if (hideOneTicket) {
            scope.book.priceSchedules = scope.book.priceSchedules.slice(
              0,
              scope.book.priceSchedules.length - 1
            )
          }
          routePassModal.show()
          scope.proceed = async function() {
            routePassModal.hide()
            scope.book.isProcessing = true
            if (
              scope.book.priceSchedules[scope.book.routePassChoice].quantity ===
              1
            ) {
              // skip the payment for route pass
              // scope.book.isProcessing = false
              // return resolve('Payment Done')
              $state.go("tabs.route-summary", {
                routeId: routeId,
                boardStop: boardStopId,
                alightStop: alightStopId,
                selectedDates: selectedDates,
              })
            } else {
              loadingSpinner(scope.payForRoutePass()).then(
                () => {
                  scope.book.isProcessing = false
                  return resolve("Payment Done")
                },
                () => {
                  scope.book.isProcessing = false
                  return reject("Payment Failed")
                }
              )
            }
          }

          scope.closeModal = function() {
            routePassModal.hide()
            // TODO
            return reject("routePassError")
          }
        })
      })

      scope.routePassTerms = {}
      RequestService.beeline({
        method: "GET",
        url: "/assets/routepass-tc",
      })
        .then(response => {
          scope.routePassTerms.html = htmlFrom(response.data.data)
          scope.routePassTerms.error = undefined
        })
        .catch(error => {
          scope.routePassTerms.error = error
          console.error(error)
        })

      purchaseRoutePassPromise.then(
        routePassModal.remove,
        routePassModal.remove
      )

      return purchaseRoutePassPromise
    }
  },
])
