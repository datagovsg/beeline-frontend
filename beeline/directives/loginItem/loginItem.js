import loginItemTemplate from './login-item.html';

export default function(UserService) {
  return {
    replace: true,
    scope: {showLogOut: '='},
    template: loginItemTemplate,
    controller: function($scope, $ionicPopup) {

      console.log($scope);
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
