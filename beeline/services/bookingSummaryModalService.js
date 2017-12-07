import bookingSummaryTemplate from "../templates/booking-summary-modal.html"

angular
  .module("beeline")
  .service("BookingSummaryModalService", [
    "$rootScope",
    "$ionicModal",
    "RoutesService",
    "loadingSpinner",
    "PaymentService",
    ModalService,
  ])

function ModalService(
  $rootScope,
  $ionicModal,
  RoutesService,
  loadingSpinner,
  PaymentService
) {
  this.show = booking => {
    let scope = $rootScope.$new()
    let bookingSummaryModal = $ionicModal.fromTemplate(bookingSummaryTemplate, {
      scope: scope,
      animation: "slide-in-up",
    })

    scope.modal = bookingSummaryModal
    scope.book = booking

    scope.$watch("book.price", price => {
      if (price == 0) {
        scope.disp.zeroDollarPurchase = true
      }
    })
    scope.disp = {
      termsChecked: false,
      zeroDollarPurchase: false,
      savePaymentChecked: false,
    }

    function cleanup() {
      bookingSummaryModal.remove()
    }

    let bookingSummaryPromise = loadingSpinner(
      RoutesService.getRouteFeatures(parseInt(scope.book.routeId))
    ).then(features => {
      scope.book.features = features
      return new Promise((resolve, reject) => {
        bookingSummaryModal.show()
        scope.payHandler = function() {
          try {
            bookingSummaryModal.hide()
            PaymentService.payHandler(scope.book, scope.disp.savePaymentChecked)
            scope.disp.hasError = false
            return resolve("ticket purchased successfully")
          } catch (err) {
            console.error(err)
            scope.disp.hasError = true
            return reject("ticket purhchased failed")
          }
        }

        scope.closeModal = function() {
          bookingSummaryModal.hide()
          return reject("payment is cancelled")
        }
      })
    })

    bookingSummaryPromise.then(cleanup, cleanup)

    return bookingSummaryPromise
  }
}
