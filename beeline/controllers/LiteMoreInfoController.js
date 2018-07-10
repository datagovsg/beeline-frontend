import { htmlFrom } from '../shared/util'

export default [
  '$scope',
  '$stateParams',
  'LiteRoutesService',
  'RoutesService',
  function ($scope, $stateParams, LiteRoutesService, RoutesService) {
    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let companyId = $stateParams.companyId
    let label = $stateParams.label
    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    // https://github.com/angular/angular.js/wiki/Understanding-Scopes
    $scope.data = {
      companyId,
      label,
    }

    // ------------------------------------------------------------------------
    // Data Loading
    // ------------------------------------------------------------------------
    LiteRoutesService.fetchLiteRoute($scope.data.label).then(liteRoute => {
      $scope.data.liteRoute = liteRoute[$scope.data.label]
      $scope.data.features = htmlFrom(liteRoute[$scope.data.label].features)
    })
  },
]
