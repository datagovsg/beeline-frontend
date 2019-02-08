import progressBar from './progressBar.html'

angular.module('beeline').directive('progressBar', [
  function () {
    return {
      restrict: 'E',
      template: progressBar,
      scope: {
        backer1: '<',
        pax1: '<',
        price1: '<',
        detail: '<',
        needed: '<',
        displayLabel: '=?',
      },
      controller: [
        '$scope',
        function ($scope) {
          if (angular.isUndefined($scope.displayLabel)) {
            $scope.displayLabel = true
          }
        },
      ],
      link: function (scope, elem, attr) {
        scope.$watchGroup(['backer1', 'pax1'], () => {
          scope.percentage = Math.min(scope.backer1 / scope.pax1, 1)
        })
      },
    }
  },
])
