export default [
  '$scope',
  'MapOptions',
  function($scope, MapOptions) {
    $scope.map = MapOptions.defaultMapOptions();
  }
];
