
export default function initStripe(UserService) {
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
          var handler = StripeCheckout.configure({
            key: stripeKey,
            locale: 'auto',
            token: function(token) {
              resolve(token);
            },
            closed: function() {
              resolve(null);
            },
          });
          handler.open({
            name: 'Beeline',
            description: description,
            amount: amount,
            currency: 'SGD',
            email: UserService.getUser().email,
          });
        });
      })
    },
    loaded: StripeCheckout ? true : false,
  };
}
