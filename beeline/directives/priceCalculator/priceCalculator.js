
export default function init(app) {
    app.directive('priceCalculator', [
        function () {
            return {
                restrict: 'E',
                template: require('./priceCalculator.html'),
            };
        }]);
}
