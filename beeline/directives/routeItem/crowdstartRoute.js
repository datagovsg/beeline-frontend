angular.module('beeline').directive('crowdstartRoute', [
  'CrowdstartService',
  function (CrowdstartService) {
    return {
      template: require('./crowdstartRoute.html'),
      scope: {
        route: '<',
      },
      controller: [
        '$scope',
        function ($scope) {
          $scope.bids = {}
          $scope.$watch(
            () => CrowdstartService.getBids(),
            bids => ($scope.bids = bids)
          )
        },
      ],
    }
  },
])
