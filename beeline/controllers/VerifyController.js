export default [
    '$scope',
    'UserService',
    '$state',
    '$ionicModal',
    '$ionicPopup',
    '$timeout',
  function(
      $scope,
      UserService,
      $state,
      $ionicModal,
      $ionicPopup,
      $timeout
  ) {
  	$scope.login = {
  		telephone: '',
      errorMessage: null,
      resendTimeout: false,
  	};

  	//set the Login button labels and message for Settings page
    $scope.$on('$ionicView.afterEnter',() => {
      // Reset data
      $scope.login.code = '';
      $scope.login.telephone = UserService.telephone || '';
    });

    $scope.resend = function() {
      $scope.login.resendTimeout = true
      $timeout(() => {
        $scope.login.resendTimeout = false;
      }, 30000);
      UserService.sendTelephoneVerificationCode(UserService.telephone)
      .then(null, function(error){
  			$scope.login.errorMessage = 'There was a problem sending the SMS code. Please try again later.';
  		});
    }

    $scope.submit = function() {
      UserService.verifyTelephone($scope.login.code)
      .then(function(response) {
        window.localStorage.sessionToken = UserService.sessionToken;
        UserService.afterLogin();
      }, (err) => {
        $scope.login.errorMessage = "The code you submitted is incorrect. Please try again."
      })
    };
  }
];
