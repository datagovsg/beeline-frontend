
var stripeKey;

export default function initStripe(UserService) {

  UserService.beeline({
    url: '/stripe-key',
    method: 'GET',
  })
  .then((response) => {
    stripeKey = response.data.publicKey;
  });

  return {
    promptForToken(description, amount) {
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
            amount: amount
          });
        });
      },
    loaded: StripeCheckout ? true : false,
  };
}
