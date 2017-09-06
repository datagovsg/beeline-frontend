
import bookingSummaryTemplate from '../templates/booking-summary-modal.html';
import assert from 'assert';

angular.module('beeline')
.service('BookingSummaryModalService', modalService)

function modalService($rootScope, $ionicModal, RoutesService, loadingSpinner, StripeService, assetScopeModalService, PaymentService) {
  this.show = (booking) => {
    var scope = $rootScope.$new();
    var bookingSummaryModal = $ionicModal.fromTemplate(
      bookingSummaryTemplate, {
        scope: scope,
        animation: 'slide-in-up',
      });

    scope.modal = bookingSummaryModal;
    scope.book = booking
    scope.disp = {
      termsChecked: false,
      zeroDollarPurchase: scope.book.price === 0,
    }

    function cleanup() {
      bookingSummaryModal.remove();
    }

    var bookingSummaryPromise = RoutesService.getRouteFeatures(parseInt(scope.book.routeId))
      .then((features)=>{
        scope.book.features = features;
        return new Promise((resolve, reject) => {
          bookingSummaryModal.show()
          scope.payHandler = function () {
            try {
              bookingSummaryModal.hide()
              PaymentService.payHandler(scope.book, scope.book.savedPaymentInfo)
              scope.disp.hasError = false
              return resolve('ticket purchased successfully')
            }
            catch(err) {
              console.log(err)
              scope.disp.hasError = true
              return reject('ticket purhchased failed')
            }
          }

          scope.closeModal = function () {
            bookingSummaryModal.hide()
            return reject('payment is cancelled')
          }
        })
      })


    bookingSummaryPromise.then(cleanup, cleanup);

    return bookingSummaryPromise;
  }
}
