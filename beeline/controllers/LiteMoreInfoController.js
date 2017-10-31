export default [
  '$scope', '$state', '$stateParams', 'LiteRoutesService', 'RoutesService',
  function($scope, $state, $stateParams, LiteRoutesService, RoutesService) {
    // https://github.com/angular/angular.js/wiki/Understanding-Scopes
    $scope.data = {
      companyId: null,
      label: null,
    };

    $scope.data.companyId = $stateParams.companyId;
    $scope.data.label = $stateParams.label;
    LiteRoutesService.fetchLiteRoute($scope.data.label).then((liteRoute) => {
      $scope.data.liteRoute = liteRoute[$scope.data.label];
      RoutesService.getRouteFeatures($scope.data.liteRoute.id).then((data)=>{
       $scope.data.features = data;
     })
    })
}]
