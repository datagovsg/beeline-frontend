
angular.module('beeline')
.factory('FastCheckoutService', function fastCheckoutService(RoutesService, UserService, purchaseRoutePassModalService) {

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

    //  modal for purchase route pass
    function purchaseRoutePass(routeId, hasSavedPaymentInfo, savedPaymentInfo) {
      return purchaseRoutePassModalService.show(routeId, hasSavedPaymentInfo, savedPaymentInfo)
    }


    function routeQualifiedForRoutePass(route) {
      if (route && route.tags) {
        var rpList = route.tags.filter((tag) => tag.includes('rp-'))
        return rpList && rpList.length === 1 ? true : false
      }
    }

    function confirmTermAndCondition() {

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
                await purchaseRoutePass(route, routeId, hasSavedPaymentInfo, paymentInfo)
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
