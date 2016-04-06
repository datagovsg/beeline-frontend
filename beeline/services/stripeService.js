
var stripeKey = 'pk_test_vYuCaJbm9vZr0NCEMpzJ3KFm'; // test
// var stripeKey = 'pk_live_otlt8I0nKU3BNYPf3doC78iW'; // live

export default function initStripe() {
    // var cardIOResponseFields = [
    //   "card_type",
    //   "redacted_card_number",
    //   "card_number",
    //   "expiry_month",
    //   "expiry_year",
    //   "cvv",
    //   "zip"
    // ];

    // var onCardIOCheck = function (canScan) {
    //     var scanBtn = document.getElementById("scanBtn");
    //     var saveCust = document.getElementById("saveCust");
    // };

    // CardIO.canScan(onCardIOCheck);

    // Create SCRIPT object
    var stripeResolve;
    var stripeReady = new Promise((resolve, reject) => stripeResolve = resolve);
    var stripeHandler;
    var tokenResolve, tokenReject;
    var tokenPromise;
    window.stripeLoaded = stripeResolve;
    window.stripeError = stripeReject;
    var scriptElem = document.createElement('SCRIPT');
    scriptElem.setAttribute('src', 'https://checkout.stripe.com/checkout.js');
    scriptElem.setAttribute('async', '')
    scriptElem.setAttribute('onload', 'stripeLoaded()')
    scriptElem.setAttribute('onerror', 'stripeError()')
    document.body.appendChild(scriptElem);

    var instance = {
      promptForToken(description, amount) {
        tokenPromise = new Promise((resolve, reject) => {
          tokenResolve = resolve;
          tokenReject = reject;
        })
        stripeReady.then(() => {
          stripeHandler.open({
            name: 'Beeline',
            description: description,
            amount: amount
          });
        })
        return tokenPromise;
      },
      loaded: false,
    }

    stripeReady.then(() => {
      var handler = StripeCheckout.configure({
        key: stripeKey,
        locale: 'auto',
        token: function(token) {
          tokenResolve(token);
          tokenReject = tokenResolve = null;
        },
        closed() {
          if (tokenResolve) {
            tokenResolve(null);
          }
          tokenReject = tokenResolve = null;
        }
      });
      instance.loaded = true;
      stripeHandler = handler;
    })

    return instance;
};
