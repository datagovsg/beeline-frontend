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
      $scope.$watch(function() {
        return UserService.user
      }, function(newUser) {
        $scope.user = newUser;

        // What to configure if the user is logged in 
        if ($scope.user) {
          $scope.buttonText = "Log Out";
          $scope.buttonAction = function() {
            $ionicPopup.confirm({
              title: 'Logout',
              template: 'Do you want to log out?'
            })
            .then(function(response) {
              if (response) UserService.logOut();
            });
          };
        } 

        // What to configure if the user is logged out
        else {
          $scope.buttonText = "Log In";
          $scope.buttonAction = function() {
            UserService.logIn();
          }
        }

      });
    }
  };
};
