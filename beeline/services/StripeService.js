
export default function initStripe(UserService, $ionicPlatform) {
  var stripeKeyPromise = UserService.beeline({
    url: '/stripe-key',
    method: 'GET',
  })
  .then((response) => {
    Stripe.setPublishableKey(response.data.publicKey);
    return response.data.publicKey;
  });

  return {
    async promptForToken(description, amount, isAddPayment) {
      if (window.CardIO) {
        var cardDetails = await new Promise((resolve, reject) => CardIO.scan({
          "expiry": true,
          "cvv": true,
          "zip": false,
          "suppressManual": false,
          "suppressConfirm": false,
          "hideLogo": true
        }, resolve, () => resolve(null)));

        if (cardDetails == null) return;

        return stripeToken = await new Promise((resolve, reject) => Stripe.createToken({
          number:     cardDetails["card_number"],
          cvc:        cardDetails["cvv"],
          exp_month:  cardDetails["expiry_month"],
          exp_year:   cardDetails["expiry_year"],
        }, (statusCode, response) => {
          if (response.error)
            reject(response.error.message);
          else
            resolve(response);
        }));
      }
      else if (StripeCheckout) {
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
              name: 'Beeline',
              description: description,
              amount: Math.round(amount),
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
      }
    },
    loaded: StripeCheckout ? true : false,
  };
}
