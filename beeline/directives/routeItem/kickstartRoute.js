angular.module("beeline").directive("kickstartRoute", [
  "CrowdstartService",
  function(CrowdstartService) {
    return {
      template: require("./kickstartRoute.html"),
      scope: {
        route: "<",
      },
      controller: [
        "$scope",
        function($scope) {
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
