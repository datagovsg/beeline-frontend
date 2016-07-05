import priceCalculatorTemplate from './priceCalculator.html';

export default [
  'BookingService',
  function(BookingService) {
    return {
      restrict: 'E',
      template: priceCalculatorTemplate,
      scope: {
        'booking': '=',
        'price': '=?',
      },
      link: function(scope, elem, attr) {
        scope.isCalculating = 0;

        function stopCalculating() {
          scope.isCalculating = Math.max(0, scope.isCalculating - 1);
        }

        var latestRequest = null;
        scope.$watch(
          () => _.pick(scope.booking, ['selectedDates' /* qty, promoCode */]),
          function() {
            if (!scope.booking.route) {
              return;
            }

            // Provide a price summary first (don't count total due)
            // This allows the page to resize earlier, so that when
            // users scroll down the bounce works ok.
            scope.priceInfo = scope.priceInfo || {};
            scope.priceInfo.pricesPerTrip = BookingService.summarizePrices(scope.booking);

            scope.isCalculating++;
            var promise = BookingService.computePriceInfo(scope.booking)
            .then((priceInfo) => {
              // Check to ensure that the order of
              // replies don't affect the result
              if (promise != latestRequest)
                return;
              scope.priceInfo = priceInfo;
              scope.price = priceInfo.totalDue;
              scope.errorMessage = null;
            })
            .catch((error) => {
              scope.priceInfo = {};
              scope.price = undefined;
              scope.errorMessage = error.data.message;
            })
            .then(stopCalculating);

            latestRequest = promise;
          }, true);
      }
    };
  }];
