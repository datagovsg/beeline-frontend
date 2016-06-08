import priceCalculatorTemplate from './priceCalculator.html';

export default [
  'BookingService',
  function(BookingService) {
    return {
      restrict: 'E',
      template: priceCalculatorTemplate,
      scope: {
        'booking': '=',
        'readOnly': '=',
      },
      link: function(scope, elem, attr) {
        scope.isCalculating = false;

        function stopCalculating() {
          scope.isCalculating = false;
        }

        scope.$watch('booking', function() {
          if (!scope.booking.route) {
            return;
          }

          scope.isCalculating = true;
          BookingService.computePriceInfo(scope.booking)
          .then((priceInfo) => {
            scope.priceInfo = priceInfo;
          })
          .then(stopCalculating, stopCalculating);
        }, true);
      }
    };
  }];
