import assert from 'assert';

export default [
    '$scope',
    '$state',
    '$http',
    '$ionicPopup',
    'BookingService',
    'UserService',
    'CreditCardInputService',
    'StripeService',
    function ($scope, $state, $http, $ionicPopup,
      BookingService, UserService, CreditCardInputService,
    StripeService) {

        $scope.currentBooking = {};
        $scope.currentRouteInfo = {};
        $scope.$on('$ionicView.beforeEnter', () => {
          $scope.currentBooking = BookingService.getCurrentBooking();
        });

        /* On this page we can only add promo codes... */
        $scope.$watch('BookingService.currentBooking.promoCodes',
                    () => {
                      BookingService.computePriceInfo($scope, $http)
                      .then((priceInfo) => {
                        $scope.currentBooking.priceInfo = priceInfo;
                      })
                    },
                    true);

        $scope.waitingForPaymentResult = false;

        // methods
        $scope.pay = async function() {
            try {
                // disable the button
                $scope.waitingForPaymentResult = true;

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

                  var stripeToken = await new Promise((resolve, reject) => Stripe.createToken({
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
                else if (StripeService.loaded) { // Use Stripe Checkout
                  var stripeToken = await StripeService.promptForToken();
                  if (stripeToken == null)
                    return;
                }
                else { // Last resort :(
                  throw new Error("There was some difficulty contacting the payment gateway." +
                    " Please check your Internet connection")
                  var cardDetails = await CreditCardInputService.getInput()
                  if (cardDetails == null)
                    return;
                  var stripeToken = await new Promise((resolve, reject) => Stripe.createToken({
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

                if (!('id' in stripeToken)) {
                    alert("There was an error contacting Stripe");
                    return;
                }

                var result = await UserService.beeline({

                    method: 'POST',
                    url: '/transactions/payment_ticket_sale',
                    data: {
                        stripeToken: stripeToken.id,
                        trips: BookingService.prepareTrips($scope.currentBooking),
                    },
                });

                // This gives us the transaction items
                assert(result.status == 200);

                $state.go('tabs.booking-confirmation');
            } catch (err) {
              await $ionicPopup.alert({
                title: 'Error processing payment',
                template: err,
              })
            } finally {
              $scope.$apply(() => {
                $scope.waitingForPaymentResult = false;
              })
            }
        };

		$scope.addPromoCode = function() {
			var code = document.getElementById('promocode').value;

			console.log(code);

			if ((typeof(code) != 'undefined')&&(code.trim() != ''))
			{
				if (typeof(BookingService.currentBooking.promoCodes) == 'undefined')
					BookingService.currentBooking.promoCodes = [];

				if (BookingService.currentBooking.promoCodes.indexOf(code) != '-1') //dupe
					console.log('Duplicate code')
				else
				{
					BookingService.currentBooking.promoCodes.push(code);
					code = '';
				}
			}
		}
  },
];
