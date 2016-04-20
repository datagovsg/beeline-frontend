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
      $scope.$watch(function() {
        return UserService.user
      }, function(newUser) {
        $scope.user = newUser;
      });

      //Log in / Log out button in settings page
      $scope.logIn = function () { UserService.logIn(); };
      $scope.logOut = function () {
        $ionicPopup.confirm({
          title: 'Logout',
          template: 'Do you want to log out?'
        })
        .then(function(response) {
          if (response) UserService.logOut();
        })
      };

    }
  };
};
