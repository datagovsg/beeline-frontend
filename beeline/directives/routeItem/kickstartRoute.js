
export default function (KickstarterService) {
  return {
    template: require('./kickstartRoute.html'),
    scope: {
      'route': '<'
    },
    controller($scope) {
      $scope.bids = {}
      $scope.$watch(() => KickstarterService.getBids(),
        bids => $scope.bids = bids)
    }
  }
}
