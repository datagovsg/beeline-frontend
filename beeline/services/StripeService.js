
var stripeKey = 'pk_test_vYuCaJbm9vZr0NCEMpzJ3KFm'; // test
// var stripeKey = 'pk_live_otlt8I0nKU3BNYPf3doC78iW'; // live

export default function initStripe() {
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
