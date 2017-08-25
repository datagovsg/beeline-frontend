
import bookingSummaryTemplate from '../templates/booking-summary-modal.html';
import assert from 'assert';

angular.module('beeline')
.service('bookingSummaryModalService', modalService)

function modalService($rootScope, $ionicModal, RoutesService, loadingSpinner, StripeService, assetScopeModalService) {
  this.show = (route, routeId, hasSavedPaymentInfo, savedPaymentInfo) => {
    var scope = $rootScope.$new();
    var bookingSummaryModal = $ionicModal.fromTemplate(
      bookingSummaryTemplate, {
        scope: scope,
        animation: 'slide-in-up',
      });

    scope.modal = bookingSummaryModal;

    scope.data = {
      price: null,
      route: null,
      features: null
    }


    function cleanup() {
      bookingSummaryModal.remove();
    }

    scope.closeModal = function () {
      bookingSummaryModal.hide()
    }


    purchaseRoutePassPromise.then(cleanup, cleanup);

    return purchaseRoutePassPromise;
  }
}
