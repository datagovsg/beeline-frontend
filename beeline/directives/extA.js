
angular.module('beeline').directive('extA', function () {

  return {
    template: `
      <a href="{{href}}" ng-transclude
          ng-click="openLink($event)">
      </a>
    `,
    scope: {
      href: '@'
    },
    transclude: true,
    restrict: 'E',
    controller ($scope) {
      $scope.openLink = function ($event) {
        $event.preventDefault();
        window.open($scope.href, '_system')
      }
    }
  }
})
