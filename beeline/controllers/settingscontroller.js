
export var SettingsController =[
    '$scope',
    'userService',
    '$state',
    '$ionicModal',
    '$ionicPopup',
function(
    $scope,
    userService,
    $state,
    $ionicModal,
    $ionicPopup
) {
  $scope.userService = userService;

	$scope.login = {
		status: false,
		phoneNum: '',
		msg: '',
		btntxt: '',
		truemsg: 'You are currently logged in as ', //append tel num
		falsemsg: 'Log in to make and view your bookings',
		truebtntxt: 'LOG OUT',
		falsebtntxt: 'LOG IN',
		name: 'John Doe',
		email: 'john.doe@fakeemail.com',
		contact: '+65 12345678',
		logoutModal: '',
		errmsg: '',
		nextDisabled: true
	};

	//set the Login button labels and message for Settings page
    $scope.$on('$ionicView.beforeEnter',()=>{
		$scope.login.status = (userService.sessionToken == undefined) ? false : true;

		if ($scope.login.status)
		{
			if ($state.current.name == "tab.settings") {
				$scope.login.btntxt = $scope.login.truebtntxt;
				$scope.login.msg = $scope.login.truemsg;
			}
			else {
				$state.go("tab.settings");
			}
		}
		else //not logged in
		{
			if ($state.current.name == "tab.settings") {
				$scope.login.btntxt = $scope.login.falsebtntxt;
				$scope.login.msg = $scope.login.falsemsg;
			}

			if ($state.current.name == 'tab.settings-login') {
				//Set up the FAQ modal
				$ionicModal.fromTemplateUrl('login-faq.html', {
					scope: $scope,
					animation: 'slide-in-up'
				}).then(function(modal) {
					$scope.loginFAQModal = modal;
				});

				document.getElementById('loginphone').focus();
			}

			if ($state.current.name == 'tab.settings-login-verify') {
console.log($scope.login)
				//fill in the user's phone number in page
				$scope.login.phoneNum = userService.mobileNo;
			}
		}
    });

	//Log in / Log out button in settings page
	$scope.logInOut = function () {
		if ($scope.login.status == false)
		{
			userService.logIn();
		}
		else //user logged in
		{
      $ionicPopup.confirm({
        title: 'Logout',
        template: 'Do you want to log out?'
      })
      .then((res) => {
        if (res) {
          userService.logOut();
        }
      })
		}
	};

	//Phone Number submission
    $scope.phoneNumCheckOK = function() {
		var phonenum = document.getElementById('loginphone').value;
		var numonlyreg = new RegExp('^[0-9]+$');

		//Check empty + all are digits
		if ((phonenum.trim() == '')||(!numonlyreg.test(phonenum)))
		{
			$scope.login.errmsg = 'Please specify a valid phone number';
			$scope.login.nextDisabled = true;

			return false;
		}
		else
		{
			$scope.login.errmsg = '';
			$scope.login.nextDisabled = false;

			//this is needed for phoneNumSubmit. Don't remove.
			$scope.login.phoneNum = phonenum;

			return true;
		}
    };

	//NEXT button clicked (error checking passed)
	$scope.phoneNumSubmit = function() {
		userService.sendTelephoneVerificationCode($scope.login.phoneNum).then(function(response){
			userService.mobileNo = $scope.login.phoneNum;

			//send user to SMS code input page
			$state.go('tab.settings-login-verify');
		}, function(error){
			alert('SMS code send error. Please try again.');
		});
	};

    $scope.submit = function(code) {
        userService.verifyTelephone(code).then(function(response) {
            if (response) {
                $state.go(userService.afterLoginGoWhere ?
                     userService.afterLoginGoWhere
                     : "tab.settings");
                userService.afterLoginGoWhere = undefined;
            }
        })
    };

    $scope.$on('$destroy', function() {
        if ($scope.modal){
            $scope.modal.remove();
        }
    });

	$scope.showBookingHistory = function() {
		console.log('show booking history');
	};
}];
