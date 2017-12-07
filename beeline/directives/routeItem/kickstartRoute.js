export default [
  "KickstarterService",
  function(KickstarterService) {
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
            () => KickstarterService.getBids(),
            bids => ($scope.bids = bids)
          )
        },
      ],
    }
  },
]
