angular.module('beeline').directive('touchStart', function () {
  return {
    restrict: 'A',
    link: function ($scope, $element) {
      $element.bind('touchstart', onTouchStart)

      function onTouchStart (event) {
        var method = $element.attr('touch-start')
        $scope.$event = event
        $scope.$apply(method)
      };
    },
  }
})
