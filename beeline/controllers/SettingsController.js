export default [
  '$scope',
  'UserService',
  '$state',
  '$ionicModal',
  '$ionicPopup',
  '$ionicLoading',
  function(
    $scope,
    UserService,
    $state,
    $ionicModal,
    $ionicPopup,
    $ionicLoading
  ) {
    
    // Renew the user each time before entering
    $scope.$on('$ionicView.beforeEnter', function() {
      UserService.getCurrentUser()
      .then((user) => {
        $scope.user = user;
      });
    });

    //Log in / Log out button in settings page
    $scope.logIn = function () {
      UserService.logIn();
    };
    $scope.logOut = function () {
      $ionicPopup.confirm({
        title: 'Logout',
        template: 'Do you want to log out?'
      })
      .then((res) => {
        if (res) {
          UserService.logOut();
        }
      })
    };

  }
];
