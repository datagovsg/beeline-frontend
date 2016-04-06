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
        // navigate away if we don't have data (e.g. due to refresh)
        if (!BookingService.currentBooking) {
            $state.go('tabs.booking-pickup');
        }
        //
        $scope.BookingService = BookingService;

        /** FIXME this can be potentially very slow. Should ignore the routeInfo entry **/
        $scope.$watch('BookingService.currentBooking',
                    () => BookingService.updatePrice($scope, $http),
                    true);
        BookingService.updatePrice($scope, $http);

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
                        trips: BookingService.prepareTrips(),
                    },
                });

                // This gives us the transaction items
                assert(result.status == 200);

                // Read the transaction items back info the booking service.
                // Parse the transactions...
                let txn = result.data;
                BookingService.bookingTransaction = txn;
                //  txn.transactionItems = _.groupBy(txn.transactionItems,
                //      x => x.itemType);

                //  txn.transactionItems.ticketSale /* array of transactionitems */
                //          = txn.transactionItems.ticketSale
                //              .map(tsti => tsti.ticketSale) /* array of tickets */
                //  txn.transactionItems.ticketSale
                //          = _.groupBy(txn.transactionItems.ticketSale,
                //                  t => t.boardStop.trip.date);

                // Alternatively: It is difficult and complicated to parse the transaction
                // Just cheat and show them the data we have
                // and hope the serve has not changed anything

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
