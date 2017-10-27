
export default ['UserService', '$ionicPopup', '$ionicPlatform', '$rootScope',
  function initStripe(UserService, $ionicPopup, $ionicPlatform, $rootScope) {
    var stripeKeyPromise = UserService.beeline({
      url: '/stripe-key',
      method: 'GET',
    })
    .then((response) => {
      Stripe.setPublishableKey(response.data.publicKey);
      return response.data.publicKey;
    });

    function tokenFromStripeCheckout(description, amount, isAddPayment) {
      return stripeKeyPromise.then((stripeKey) => {
        return new Promise((resolve, reject) => {
          var deregister;
          var handler = StripeCheckout.configure({
            key: stripeKey,
            locale: 'auto',
            // allowRememberMe: false,
            token: function(token) {
              deregister();
              resolve(token);
            },
            closed: function() {
              deregister();
              resolve(null);
            },
          });

          deregister = $ionicPlatform.registerBackButtonAction(() => {
            handler.close();
          }, 401);

          let handlerOptions = {
            name: $rootScope.o.APP.NAME,
            description: description,
            amount: Math.round(amount),
            allowRememberMe: false,
            currency: 'SGD',
            email: UserService.getUser().email,
            // panelLabel: "Add Card Details",
          }

          if (isAddPayment) {
            handlerOptions = {
              name: 'Add Card Details',
              description: description,
              panelLabel: "Add Card",
              allowRememberMe: false,
              email: UserService.getUser().email
            }
          }

          handler.open(handlerOptions);
        });
      });
    };

    async function tokenFromCardIO(description, amount, isAddPayment) {
      var cardDetails = await new Promise((resolve, reject) => CardIO.scan({
        "expiry": true,
        "cvv": true,
        "zip": false,
        "suppressManual": false,
        "suppressConfirm": false,
        "hideLogo": true
      }, resolve, () => resolve(null)));

      if (cardDetails == null) return;

      var tokenPromise = new Promise((resolve, reject) => Stripe.createToken({
        number:     cardDetails["card_number"],
        cvc:        cardDetails["cvv"],
        exp_month:  cardDetails["expiry_month"],
        exp_year:   cardDetails["expiry_year"],
      }), (statusCode, response) => {
        if (response.error)
          reject(new Error(response.error.message));
        else
          resolve(response);
      });

      return tokenPromise;
    };

    return {
      async promptForToken(description, amount, isAddPayment) {
        var tokenPromise;

        if (window.CardIO) {
          tokenPromise = tokenFromCardIO(description, amount, isAddPayment);
        }
        else if (StripeCheckout) {
          tokenPromise = tokenFromStripeCheckout(description, amount, isAddPayment);
        }

        tokenPromise.catch((err) => {
          $ionicPopup.alert(`There was an error contacting Stripe. ${err && err.message}`);
        })

        return tokenPromise;
      },
      loaded: (typeof StripeCheckout !== 'undefined') ? true : false,
    };
}]
