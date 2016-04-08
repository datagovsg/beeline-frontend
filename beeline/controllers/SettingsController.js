
export default [
    '$scope',
    'UserService',
    '$state',
    '$ionicModal',
    '$ionicPopup',
function(
    $scope,
    UserService,
    $state,
    $ionicModal,
    $ionicPopup
) {
  $scope.user = null;
	$scope.login = {
		errorMessage: '',
	};

	//set the Login button labels and message for Settings page
  $scope.$on('$ionicView.beforeEnter',()=>{
    $scope.user = UserService.getCurrentUser();
  });

	//Log in / Log out button in settings page
	$scope.logIn = function () {
    UserService.logIn();
  }

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
  }

	$scope.showBookingHistory = function() {
		console.error("UNIMPLEMENTED STUB");
	};
}];
