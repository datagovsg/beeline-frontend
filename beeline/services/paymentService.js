import processingPaymentsTemplate from "../templates/processing-payments.html"
import assert from "assert"
import _ from "lodash"

angular.module("beeline").factory("PaymentService", [
  "UserService",
  "RequestService",
  "RoutesService",
  "$ionicPopup",
  "$ionicLoading",
  "BookingService",
  "StripeService",
  "loadingSpinner",
  "TicketService",
  "$state",
  function paymentService(
    UserService,
    RequestService,
    RoutesService,
    $ionicPopup,
    $ionicLoading,
    BookingService,
    StripeService,
    loadingSpinner,
    TicketService,
    $state
  ) {
    /** After you have settled the payment mode **/
    // book is booking Object
    const completePayment = async function completePayment(
      paymentOptions,
      book
    ) {
      try {
        let result = await RequestService.beeline({
          method: "POST",
          url: "/transactions/tickets/payment",
          data: _.defaults(paymentOptions, {
            trips: BookingService.getTripsFromBooking(book),
            promoCode: book.promoCode ? { code: book.promoCode } : { code: "" },
            applyRoutePass: book.applyRoutePass ? true : false,
            expectedPrice: book.price,
          }),
        })

        assert(result.status == 200)
        TicketService.setShouldRefreshTickets()
      } finally {
        RoutesService.fetchRoutePasses(true)
        RoutesService.fetchRoutePassCount()
        RoutesService.fetchRoutesWithRoutePass()
      }
    }

    /*
      Helper function to wrap the UI changes around payment
    */
    const completePaymentWithUI = async function completePaymentWithUI(
      paymentOptions,
      book
    ) {
      try {
        $ionicLoading.show({
          template: processingPaymentsTemplate,
        })

        await completePayment(paymentOptions, book)
        $state.go("tabs.route-confirmation")
      } catch (err) {
        await $ionicPopup.alert({
          title: "Error processing payment",
          template: err.data.message,
        })
      } finally {
        $ionicLoading.hide()
      }
    }

    const payZeroDollar = async function payZeroDollar(book) {
      if (
        await $ionicPopup.confirm({
          title: "Complete Purchase",
          template: "Are you sure you want to complete the purchase?",
        })
      ) {
        try {
          await completePaymentWithUI(
            {
              stripeToken: "this-will-not-be-used",
            },
            book
          )
        } catch (e) {
          console.error(e)
        }
      }
    }

    // Prompts for card and processes payment with one time stripe token.
    const payWithoutSavingCard = async function payWithoutSavingCard(book) {
      try {
        let stripeToken = await loadingSpinner(
          StripeService.promptForToken(
            null,
            isFinite(book.price) ? book.price * 100 : "",
            null
          )
        )

        if (!stripeToken) {
          return
        }

        await completePaymentWithUI(
          {
            stripeToken: stripeToken.id,
          },
          book
        )
      } catch (err) {
        await $ionicPopup.alert({
          title: "Error contacting the payment gateway",
          template: (err.data && err.data.message) || err,
        })
      }
    }

    // Processes payment with customer object. If customer object does not exist,
    // prompts for card, creates customer object, and proceeds as usual.
    const payWithSavedInfo = async function payWithSavedInfo(book) {
      try {
        if (!book.hasSavedPaymentInfo) {
          let stripeToken = await StripeService.promptForToken(
            null,
            isFinite(book.price) ? book.price * 100 : "",
            null
          )

          if (!stripeToken) {
            return
          }

          await loadingSpinner(UserService.savePaymentInfo(stripeToken.id))
        }

        let user = await UserService.getUser()

        await completePaymentWithUI(
          {
            customerId: user.savedPaymentInfo.id,
            sourceId: _.head(user.savedPaymentInfo.sources.data).id,
          },
          book
        )
      } catch (err) {
        await $ionicPopup.alert({
          title: "Error saving payment method",
          template: err.data.message,
        })
      }
    }

    let instance = {
      completePayment,
      completePaymentWithUI,
      payZeroDollar,
      payWithoutSavingCard,
      payWithSavedInfo,
      payForRoutePass: async function(
        route,
        expectedPrice,
        passValue,
        paymentOptions
      ) {
        let paymentPromise
        try {
          let routePassTagList = route.tags.filter(tag => {
            return tag.includes("rp-")
          })
          // assert there is no more than 1 rp- tag
          assert(routePassTagList.length === 1)
          await loadingSpinner(
            RequestService.beeline({
              method: "POST",
              url: "/transactions/route_passes/payment",
              data: _.defaults(paymentOptions, {
                creditTag: routePassTagList[0],
                promoCode: { code: "" },
                companyId: route.transportCompanyId,
                expectedPrice: expectedPrice,
                value: passValue,
              }),
            })
          )
          paymentPromise = new Promise(async (resolve, reject) => {
            await $ionicPopup.alert({
              title: "Success",
            })
            return resolve("routePassPurchaseDone")
          })
        } catch (err) {
          paymentPromise = new Promise(async (resolve, reject) => {
            await $ionicPopup.alert({
              title: "Error processing payment",
              template: `
              <div> There was an error creating the payment. \
              ${err &&
                err.data &&
                err.data.message} Please try again later.</div>
              `,
            })
            return reject("routePassError")
          })
        } finally {
          RoutesService.fetchRoutePasses(true)
          RoutesService.fetchRoutePassCount()
          RoutesService.fetchRoutesWithRoutePass()
        }
        return paymentPromise
      },

      payHandler: async function(book, savePaymentChecked, onetimePayment) {
        if (book.price === 0) {
          await payZeroDollar(book)
        } else if (
          (book.hasSavedPaymentInfo && !onetimePayment) ||
          savePaymentChecked
        ) {
          await payWithSavedInfo(book)
        } else {
          await payWithoutSavingCard(book)
        }
      },
    }
    return instance
  },
])
