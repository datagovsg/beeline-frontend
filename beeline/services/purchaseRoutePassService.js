
import routePassTemplate from '../templates/route-pass-modal.html';
import assert from 'assert';

angular.module('beeline')
.service('purchaseRoutePassModalService', modalService)

function modalService($rootScope, $ionicModal, RoutesService, loadingSpinner, StripeService, assetScopeModalService, PaymentService, UserService) {
  var self = this
  self.show = (route, routeId, hasSavedPaymentInfo, savedPaymentInfo) => {
    var scope = $rootScope.$new();
    var routePassModal = $ionicModal.fromTemplate(
      routePassTemplate, {
        scope: scope,
        animation: 'slide-in-up',
      });

    scope.modal = routePassModal;

    scope.book = {
      priceSchedules: null,
      routePassPrice: null,
      routePassChoice: null,
      hasSavedPaymentInfo: hasSavedPaymentInfo,
      brand: hasSavedPaymentInfo ? savedPaymentInfo.sources.data[0].brand : null,
      last4Digtis: hasSavedPaymentInfo ? savedPaymentInfo.sources.data[0].last4 : null
    }

    scope.$watch('book.routePassChoice', (choice) => {
      if (choice !== null) {
        scope.book.routePassPrice = scope.book.priceSchedules[choice].totalPrice
      }
    })

    scope.showTermsOfUse = () => assetScopeModalService.showRoutePassTCModal();

    // Prompts for card and processes payment with one time stripe token.
    scope.payForRoutePass = async function() {
      try {
        var paymentPromise
        var quantity = scope.book.priceSchedules[scope.book.routePassChoice].quantity
        var expectedPrice = scope.book.priceSchedules[scope.book.routePassChoice].totalPrice
        var passValue = route.trips[0].price * scope.book.priceSchedules[scope.book.routePassChoice].quantity
        // if user has credit card saved
        if (hasSavedPaymentInfo) {
          paymentPromise = PaymentService.payForRoutePass(route, expectedPrice, passValue, {
            customerId: savedPaymentInfo.id,
            sourceId: _.head(savedPaymentInfo.sources.data).id,
          });
        } else {
            var stripeToken = await loadingSpinner(StripeService.promptForToken(
              null,
              isFinite(scope.book.routePassPrice) ? scope.book.routePassPrice * 100 : '',
              null));

            if (!stripeToken) {
              paymentPromise =  new Promise((resolve, reject) => {
                return reject('no Stripe Token')
              })
            }

            //saves payment info if doesn't exist
            if (scope.book.savePaymentChecked) {
              await UserService.savePaymentInfo(stripeToken.id)
              let user = await UserService.getUser()
              paymentPromise =  PaymentService.payForRoutePass(route, expectedPrice, passValue, {
                customerId: user.savedPaymentInfo.id,
                sourceId:_.head(user.savedPaymentInfo.sources.data).id,
              });
            } else {
              paymentPromise = PaymentService.payForRoutePass(route, expectedPrice, passValue, {
                stripeToken: stripeToken.id,
              });
            }

            return paymentPromise
          }
        } catch (err) {
          console.log(err)
          return new Promise((resolve, reject) => {
            return reject('routePassError')
          })
        }
      }

    function cleanup() {
      console.log('cleanup')
      routePassModal.remove();
    }

    var purchaseRoutePassPromise = RoutesService.fetchPriceSchedule(routeId).then((response) => {
      return new Promise((resolve, reject) => {
        scope.book.priceSchedules = response
        scope.book.routePassChoice = 0
        routePassModal.show()
        // scope.$on('routePassPurchaseDone', () => {
        //   return resolve('Payment Done')
        // })
        // scope.$on('routePassError', () => {
        //   return reject('Payment Failed')
        // })
        scope.proceed = async function() {
          routePassModal.hide()
          if (scope.book.priceSchedules[scope.book.routePassChoice].quantity === 1) {
            // ask to confirm T&Cs
          } else {
            return scope.payForRoutePass().then(() => {
              return resolve('Payment Done')
            },() => {
              return reject('Payment Failed')
            })
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
