
export default [
  '$scope',
  '$state',
  '$http',
  'BookingService',
  '$ionicHistory',
  function($scope, $state, $http, BookingService, $ionicHistory) {
    $scope.$on('$ionicView.afterEnter', () => {
      $ionicHistory.clearHistory()
    });
  },
];
