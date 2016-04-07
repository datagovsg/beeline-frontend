export var LoginController = [
    '$scope',
    'userService',
    '$state',
    '$ionicModal',
    '$ionicPopup',
    '$timeout',
  function(
      $scope,
      userService,
      $state,
      $ionicModal,
      $ionicPopup,
      $timeout
  ) {
    console.log("Enter scope");
    $scope.userService = userService;

  	$scope.login = {
  		phoneNumber: userService.mobileNo || '',
  		errmsg: '',
      nextDisabled: true,
      code: '',
      timeout: false,
  	};

    //Set up the FAQ modal
    $ionicModal.fromTemplateUrl('login-faq.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.loginFAQModal = modal;
    });

  	//set the Login button labels and message for Settings page
    $scope.$on('$ionicView.afterEnter',() => {
      // Reset data
      $scope.login.code = '';
    });

  	//Phone Number submission
    $scope.phoneNumCheckOK = function() {
  		var numonlyreg = /^[0-9]{8}$/;

  		//Check empty + all are digits
  		if (!numonlyreg.test($scope.login.phoneNumber))
  		{
  			$scope.login.errmsg = 'Please specify a valid phone number';
  			$scope.login.nextDisabled = true;

  			return false;
  		}
  		else
  		{
  			$scope.login.errmsg = '';
  			$scope.login.nextDisabled = false;

  			return true;
  		}
    };

  	$scope.phoneNumSubmit = function() {
      userService.logOut();
      userService.mobileNo = $scope.login.phoneNumber;
  		userService.sendTelephoneVerificationCode(userService.mobileNo)
      .then(function(response){
  			//send user to SMS code input page
  			$state.go('login-verify');
  		}, function(error){
  			$ionicPopup.alert({
          title: 'Error',
          template: 'There was a problem sending the SMS code. Please try again later.',
        });
  		});
  	};

    $scope.resend = function() {
      $scope.login.timeout = true
      $timeout(() => {
        $scope.login.timeout = false;
      }, 30000);
      userService.sendTelephoneVerificationCode(userService.mobileNo)
      .then(null, function(error){
  			$ionicPopup.alert({
          title: 'Error',
          template: 'There was a problem sending the SMS code. Please try again later.',
        });
  		});
    }

    $scope.submit = function() {
      userService.verifyTelephone($scope.login.code)
      .then(function(response) {
        window.localStorage.sessionToken = userService.sessionToken;
        userService.afterLogin();
      }, (err) => {
        login.errmsg = "The code you submitted is incorrect. Please try again."
      })
    };
  }
];
