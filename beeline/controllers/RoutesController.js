export default function($scope, uiGmapGoogleMapApi) {

  $scope.$watch('activeTab', () => {
    setTimeout(() => {
      $scope.$broadcast('mapRequireResize')
    }, 100)
  })
  $scope.$watch('$ionicView.afterEnter', () => {
    setTimeout(() => {
      $scope.$broadcast('mapRequireResize')
    }, 100)
  })
}
