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
        scope.$watch('booking', function() {
          if (!scope.booking.route) {
            return;
          }
          BookingService.computePriceInfo(scope.booking)
          .then((priceInfo) => {
            scope.priceInfo = priceInfo;
            scope.errorMessage = null;
          })
          .then(null, (error) => {
            scope.priceInfo = [];
            scope.errorMessage = error.data.message;
          });
        }, true);
      }
    };
  }];
