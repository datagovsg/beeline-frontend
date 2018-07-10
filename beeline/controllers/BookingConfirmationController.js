export default [
  '$scope',
  '$state',
  '$ionicHistory',
  '$ionicPlatform',
  function ($scope, $state, $ionicHistory, $ionicPlatform) {
    // ------------------------------------------------------------------------
    // Ionic events
    // ------------------------------------------------------------------------
    $scope.$on('$ionicView.afterEnter', () => {
      $ionicHistory.clearHistory()

      // Back button goes back to routes list
      const deregister = $ionicPlatform.registerBackButtonAction(() => {
        $state.go('tabs.routes')
      }, 101)
      $scope.$on('$ionicView.beforeLeave', deregister)
    })
  },
]
