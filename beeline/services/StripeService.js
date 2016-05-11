
export default function initStripe(UserService) {
  var stripePromise = UserService.beeline({
    method: 'GET',
    url: '/stripe-key'
  })
  .then((response) => {
    Stripe.setPublishableKey(response.data.publicKey);
    return response.data.publicKey
  })

  return {
    promptForToken(description, amount) {
        return stripePromise.then((stripeKey) => {
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
            email: UserService.getUser().email,
          });
        });
      },
    loaded: StripeCheckout ? true : false,
  };
}
