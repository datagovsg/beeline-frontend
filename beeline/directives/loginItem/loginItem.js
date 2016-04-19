import loginItemTemplate from './login-item.html';

export default function(UserService) {
  return {
    replace: true,
    scope: {
      user: '=',
      showLogOut: '@',
      message: '@'
    },
    template: loginItemTemplate,
    controller: function($scope, $ionicPopup) {

      // Check the user each time before entering
      $scope.$on('$ionicView.beforeEnter', function() {
        UserService.getCurrentUser()
        .then((user) => {
          $scope.user = user;
        });
      });

      //Log in / Log out button in settings page
      $scope.logIn = function () { UserService.logIn(); };
      $scope.logOut = function () {
        $ionicPopup.confirm({
          title: 'Logout',
          template: 'Do you want to log out?'
        })
        .then(function(response) {
          if (res) UserService.logOut();
        })
      };

    }
  };
};
