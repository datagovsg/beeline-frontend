
import routePassTemplate from '../templates/route-pass-modal.html';
import assert from 'assert';

angular.module('beeline')
.service('purchaseRoutePassModalService', modalService)

function modalService($rootScope, $ionicModal, RoutesService, loadingSpinner, StripeService) {
  this.show = (routeId, hasSavedPaymentInfo, savedPaymentInfo) => {
    var scope = $rootScope.$new();
    var routePassModal = $ionicModal.fromTemplate(
      routePassTemplate, {
        scope: scope,
        animation: 'slide-in-up',
      });

    scope.modal = routePassModal;

    scope.book = {
      priceSchedules: null,
      hasSavedPaymentInfo: null,
      savedPaymentInfo: null,
      routePassPrice: null,
      routePassChoice: null
    }

    scope.$watch('book.routePassChoice', (choice) => {
      if (choice !== null) {
        scope.book.routePassPrice = scope.book.priceSchedules[choice].totalPrice
      }
    })

    // pay for the route pass
    scope.completePayment = async function(paymentOptions) {
      try {
        let routePassTagList = route.tags.filter((tag) => {
          return tag.includes('rp-')
        })
        // assert there is no more than 1 rp- tag
        assert(routePassTagList.length === 1)
        let passValue = route.trips[0].price * scope.book.priceSchedules[scope.book.routePassChoice].quantity
        var result = await UserService.beeline({
          method: 'POST',
          url: '/transactions/route_passes/payment',
          data: _.defaults(paymentOptions, {
            creditTag: routePassTagList[0],
            promoCode: { code: '' },
            companyId: route.transportCompanyId,
            expectedPrice: scope.book.priceSchedules[scope.book.routePassChoice].totalPrice,
            value: passValue
          }),
        });
        assert(result.status == 200);
        scope.emit('routePassPurchaseDone')
      } catch (err) {
        return scope.$emit('routePassError')
      } finally {
        RoutesService.fetchRouteCredits(true)
        RoutesService.fetchRoutePassCount()
        RoutesService.fetchRoutesWithRoutePass()
      }
    }

    // Prompts for card and processes payment with one time stripe token.
    scope.payForRoutePass = async function() {
      try {
        var quantity = scope.book.priceSchedules[scope.book.routePassChoice].quantity
        var expectedPrice = scope.book.priceSchedules[scope.book.routePassChoice].totalPrice
        var savedPaymentInfo = scope.book.savedPaymentInfo
        // if user has credit card saved
        if (scope.book.hasSavedPaymentInfo) {
          return scope.completePayment({
            customerId: savedPaymentInfo.id,
            sourceId: _.head(savedPaymentInfo.sources.data).id,
          });
        } else {
            var stripeToken = await loadingSpinner(StripeService.promptForToken(
              null,
              isFinite(scope.book.routePassPrice) ? scope.book.routePassPrice * 100 : '',
              null));

            if (!stripeToken) {
              return scope.$emit('routePassError')
            }

            //saves payment info if doesn't exist
            if (scope.book.savePaymentChecked) {
              await UserService.savePaymentInfo(stripeToken.id)
              return scope.completePayment({
                customerId: savedPaymentInfo.id,
                sourceId: _.head(savedPaymentInfo.sources.data).id,
              });
            } else {
              return scope.completePayment({
                stripeToken: stripeToken.id,
              });
            }
          }
        } catch (err) {
          console.log(err)
          return scope.$emit('routePassError')
        }
      }

    function cleanup() {
      routePassModal.remove();
    }

    var purchaseRoutePassPromise = RoutesService.fetchPriceSchedule(routeId).then((response) => {
      return new Promise((resolve, reject) => {
        scope.book.priceSchedules = response
        scope.book.hasSavedPaymentInfo = hasSavedPaymentInfo
        scope.book.savedPaymentInfo = savedPaymentInfo
        scope.book.routePassChoice = 0
        routePassModal.show()
        scope.$on('routePassPurchaseDone', () => {
          return resolve('Payment Done')
        })
        scope.$on('routePassError', () => {
          return reject('Payment Failed')
        })
        scope.proceed = async function() {
          routePassModal.hide()
          if (scope.book.priceSchedules[scope.book.routePassChoice].quantity === 1) {
            // ask to confirm T&Cs
          } else {
            return scope.payForRoutePass()
          }
        }

        scope.closeModal = function () {
          routePassModal.hide()
          scope.$emit('routePassError')
        }
      })
    })

    purchaseRoutePassPromise.then(cleanup, cleanup);

    return purchaseRoutePassPromise;
  }
}
