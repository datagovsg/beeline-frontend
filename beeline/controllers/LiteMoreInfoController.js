export default function($scope, $state, $stateParams) {

  // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  $scope.data = {
    companyId: null,
    label: null,
  };

  $scope.data.companyId = $stateParams.companyId
  $scope.data.label = $stateParams.label
}
