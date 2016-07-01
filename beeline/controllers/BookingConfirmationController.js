
export default [
  '$scope',
  '$state',
  '$http',
  'BookingService',
  '$ionicHistory',
  '$ionicPlatform',
  function($scope, $state, $http, BookingService, $ionicHistory, $ionicPlatform) {
    $scope.$on('$ionicView.afterEnter', () => {
      $ionicHistory.clearHistory()

      // Back button goes back to routes list
      var deregister = $ionicPlatform.registerBackButtonAction(() => {
        $state.go('tabs.routes');
      }, 101)
      $scope.$on('$ionicView.beforeLeave', deregister);
    });
  },
];
