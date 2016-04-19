import priceCalculatorTemplate from './priceCalculator.html'

export default [
  'BookingService',
  function (BookingService) {
    return {
      restrict: 'E',
      template: priceCalculatorTemplate,
      scope: {
        'booking': '=',
      },
      link: function(scope, elem, attr) {
        scope.$watch('booking', function () {
          if (!scope.booking.route) {
            return;
          }
          BookingService.computePriceInfo(scope.booking)
          .then((priceInfo) => {
            scope.priceInfo = priceInfo;
          });
        }, true);
      }
    };
  }]
