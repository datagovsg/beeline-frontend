
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

    // scope.book = {
    //   price: null,
    //   route: route,
    //   features: null,
    //   applyCredits: false,
    //   selectedDates: [],
    //   boardStopId: parseInt($stateParams.boardStop),
    //   alightStopId: parseInt($stateParams.alightStop),
    //   hasSavedPaymentInfo: null,
    // }

    scope.book = booking
    scope.hasError = false
    scope.disp = {
      termsChecked: false,
      hasError: false,
      zeroDollarPurchase: scope.book.price === 0
    }

    function cleanup() {
      bookingSummaryModal.remove();
    }

    scope.closeModal = function () {
      bookingSummaryModal.hide()
    }

    // errorMessage passed back from priceCalculator
    scope.$watch('errorMessage', (err)=>{
      if (err) {
        console.log(err)
        scope.disp.hasError = true
      }
    })

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
        })
      })


    bookingSummaryPromise.then(cleanup, cleanup);

    return bookingSummaryPromise;
  }
}
