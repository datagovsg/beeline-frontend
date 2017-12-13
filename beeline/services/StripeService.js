export default [
  "UserService",
  "$ionicPopup",
  "$ionicPlatform",
  "$rootScope",
  function StripeService(UserService, $ionicPopup, $ionicPlatform, $rootScope) {
    let stripeKeyPromise = UserService.beeline({
      url: "/stripe-key",
      method: "GET",
    }).then(response => {
      Stripe.setPublishableKey(response.data.publicKey)
      return response.data.publicKey
    })

    function tokenFromStripeCheckout(description, amount, isAddPayment) {
      return stripeKeyPromise.then(stripeKey => {
        return new Promise((resolve, reject) => {
          let deregister
          let handler = StripeCheckout.configure({
            key: stripeKey,
            locale: "auto",
            // allowRememberMe: false,
            token: function(token) {
              deregister()
              resolve(token)
            },
            closed: function() {
              deregister()
              resolve(null)
            },
          })

          deregister = $ionicPlatform.registerBackButtonAction(() => {
            handler.close()
          }, 401)

          let handlerOptions = {
            name: $rootScope.o.APP.NAME,
            description: description,
            amount: Math.round(amount),
            allowRememberMe: false,
            currency: "SGD",
            email: UserService.getUser().email,
            // panelLabel: "Add Card Details",
          }

          if (isAddPayment) {
            handlerOptions = {
              name: "Add Card Details",
              description: description,
              panelLabel: "Add Card",
              allowRememberMe: false,
              email: UserService.getUser().email,
            }
          }

          handler.open(handlerOptions)
        })
      })
    }

    return {
      async promptForToken(description, amount, isAddPayment) {
        let tokenPromise

        if (StripeCheckout) {
          tokenPromise = tokenFromStripeCheckout(
            description,
            amount,
            isAddPayment
          )
        }

        tokenPromise.catch(err => {
          $ionicPopup.alert(
            `There was an error contacting Stripe. ${err && err.message}`
          )
        })

        return tokenPromise
      },
    }
  },
]
