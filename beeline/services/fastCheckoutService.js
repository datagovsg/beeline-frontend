
import routePassTemplate from '../templates/route-pass-modal.html';
import assert from 'assert';

angular.module('beeline')
.factory('FastCheckoutService', function fastCheckoutService(RoutesService, UserService, $ionicModal, $rootScope,
  StripeService, loadingSpinner) {

    var user;
    var hasSavedPaymentInfo;
    var paymentInfo;
    var ridesRemaining;
    var route;


    // login
    function userLoginPromise() {
      return new Promise((resolve,reject) => {
        if (UserService.getUser()) {
          return resolve(UserService.getUser())
        } else {
          UserService.promptLogIn().then((user) => {
            if (user) return resolve(user)
            else return reject('Not Logged In')
          })
        }
      })
    }

    // ridesRemaining promise
    function ridesRemainingPromise(routeId) {
      return new Promise((resolve,reject) => {
        if (RoutesService.getRoutePassCount()) {
          return resolve(RoutesService.getRoutePassCount()[routeId])
        } else {
          RoutesService.fetchRoutesWithRoutePass().then(() => {
            return resolve(RoutesService.getRoutePassCount()[routeId])
          }).catch((err) =>{
            return reject(err)
          })
        }
      })
    }

    //  modal for purchase route credits
    function promptForRoutePassChoice(routeId, hasSavedPaymentInfo, savedPaymentInfo) {
      var routePassScope = $rootScope.$new()
      routePassScope.book = {
        priceSchedules: null,
        hasSavedPaymentInfo: null,
        savedPaymentInfo: null,
        routePassPrice: null,
        routePassChoice: null
      }
      var routePassModal = $ionicModal.fromTemplate(routePassTemplate, {
        scope: routePassScope,
        animation: 'slide-in-up',
      });
      routePassScope.closeModal = function () {
        routePassModal.hide()
        routePassScope.$emit('routePassError')
      }
      routePassScope.$watch('book.routePassChoice', (choice) => {
        if (choice !== null) {
          routePassScope.book.routePassPrice = routePassScope.book.priceSchedules[choice].totalPrice
        }
      })
      routePassScope.proceed = async function() {
        routePassModal.hide()
        if (routePassScope.book.priceSchedules[routePassScope.book.routePassChoice].quantity === 1) {
          // ask to confirm T&Cs
        } else {
          return routePassScope.payForRoutePass(routePassScope.book.hasSavedPaymentInfo, routePassScope.book.savedPaymentInfo,
            routePassScope.book.routePassPrice, routePassScope.book.savePaymentChecked,
            routePassScope.book.priceSchedules[routePassScope.book.routePassChoice].quantity,
            routePassScope.book.priceSchedules[routePassScope.book.routePassChoice].totalPrice)
        }
      }
      // pay for the route pass
      routePassScope.completePayment = async function(paymentOptions, quantity, expectedPrice) {
        try {
          let routePassTagList = route.tags.filter((tag) => {
            return tag.includes('rp-')
          })
          // assert there is no more than 1 rp- tag
          assert(routePassTagList.length === 1)
          let passValue = route.trips[0].price * quantity
          var result = await UserService.beeline({
            method: 'POST',
            url: '/transactions/route_passes/payment',
            data: _.defaults(paymentOptions, {
              creditTag: routePassTagList[0],
              promoCode: { code: '' },
              companyId: route.transportCompanyId,
              expectedPrice: expectedPrice,
              value: passValue
            }),
          });
          assert(result.status == 200);
          routePassScope.emit('routePassPurchaseDone')
        } catch (err) {
          return routePassScope.$emit('routePassError')
        } finally {
          RoutesService.fetchRouteCredits(true)
          RoutesService.fetchRoutePassCount()
          RoutesService.fetchRoutesWithRoutePass()
        }
      }

      // Prompts for card and processes payment with one time stripe token.
      routePassScope.payForRoutePass = async function(hasSavedPaymentInfo, savedPaymentInfo, routePassPrice, savePaymentChecked, quantity, expectedPrice) {
        try {
          // if user has credit card saved
          if (hasSavedPaymentInfo) {
            return routePassScope.completePayment({
              customerId: savedPaymentInfo.id,
              sourceId: _.head(savedPaymentInfo.sources.data).id,
            }, quantity, expectedPrice);
          } else {
            var stripeToken = await loadingSpinner(StripeService.promptForToken(
              null,
              isFinite(routePassPrice) ? routePassPrice * 100 : '',
              null));

            if (!stripeToken) {
              return routePassScope.$emit('routePassError')
            }

            //saves payment info if doesn't exist
            if (savePaymentChecked) {
              await UserService.savePaymentInfo(stripeToken.id)
              return routePassScope.completePayment({
                customerId: savedPaymentInfo.id,
                sourceId: _.head(savedPaymentInfo.sources.data).id,
              }, quantity, expectedPrice);
            } else {
              return routePassScope.completePayment({
                stripeToken: stripeToken.id,
              }, quantity, expectedPrice);
            }
          }

        } catch (err) {
          return routePassScope.$emit('routePassError')
        }
      }

      return RoutesService.fetchPriceSchedule(routeId).then((response) => {
        return new Promise(async(resolve, reject) => {
          try {
            routePassScope.book.priceSchedules = response
            routePassScope.book.hasSavedPaymentInfo = hasSavedPaymentInfo
            routePassScope.book.savedPaymentInfo = savedPaymentInfo
            routePassScope.book.routePassChoice = 0
            await routePassModal.show()
            routePassScope.$on('routePassPurchaseDone', () => {
              return resolve('Payment Done')
            })
            routePassScope.$on('routePassError', () => {
              return reject('Payment Failed')
            })
            routePassScope.routePassModal = routePassModal
            routePassScope.$on('modal.hidden', () => routePassModal.remove())
          } catch(err) {
            return reject(err)
          }
        })
      })

    }


    function routeQualifiedForRoutePass(route) {
      if (route && route.tags) {
        var rpList = route.tags.filter((tag) => tag.includes('rp-'))
        return rpList && rpList.length === 1 ? true : false
      }
    }
    var instance = {

      fastCheckout: function (routeId) {
        return new Promise(async (resolve, reject) => {
          try {
            user = await userLoginPromise()
            hasSavedPaymentInfo = _.get(user, 'savedPaymentInfo.sources.data.length', 0) > 0
            paymentInfo = hasSavedPaymentInfo ? _.get(user, 'savedPaymentInfo.sources.data[0]') : null
            route = await RoutesService.getRoute(routeId)
            ridesRemaining = await ridesRemainingPromise(routeId)
            if (!ridesRemaining) {
              // if route has rp- tag
              if (route && routeQualifiedForRoutePass(route)) {
                // show the modal to purchase route pass
                await promptForRoutePassChoice(routeId, hasSavedPaymentInfo, paymentInfo)
              } else {
                // no route pass option , ask to confirm T&Cs

                // ask for stripe payment for single ticket


              }

            } else {
              // ask to confirm T&Cs
            }
            return resolve('success')
          }
          catch (err) {
            console.log(err)
            return reject('failed')
          }
        })
      }
    }

    return instance;

})
