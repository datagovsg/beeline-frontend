
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
    promptForToken(description, amount) {
      return stripeKeyPromise.then((stripeKey) => {
        return new Promise((resolve, reject) => {
          var deregister;
          var handler = StripeCheckout.configure({
            key: stripeKey,
            locale: 'auto',
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

          handler.open({
            name: 'Beeline',
            description: description,
            amount: Math.round(amount),
            currency: 'SGD',
            email: UserService.getUser().email,
          });
        });
      });
    },
    loaded: StripeCheckout ? true : false,
  };
}
