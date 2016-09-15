export default function($scope, $state, $stateParams, LiteRoutesService) {

  // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  $scope.data = {
    companyId: null,
    label: null,
  };

  $scope.data.companyId = $stateParams.companyId;
  $scope.data.label = $stateParams.label;
  LiteRoutesService.getLiteRoute($scope.data.label).then((liteRoute) => {
    $scope.data.liteRoute = liteRoute[$scope.data.label];
  })
}
