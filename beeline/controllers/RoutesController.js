export default function($scope, uiGmapGoogleMapApi) {
  // 'Resize' the map when switching between Maps and List
  // The map div only acquires a size some time after
  // the watch is called, hence the 100ms
  $scope.$watch('activeTab', () => {
    setTimeout(() => {
      $scope.$broadcast('mapRequireResize')
    }, 100)
  })

  // 'Resize' the map when switching between tabs
  $scope.$watch('$ionicView.afterEnter', () => {
    $scope.$broadcast('mapRequireResize')
  })
}
