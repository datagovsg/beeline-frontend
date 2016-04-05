'use strict';

export var SettingsController =[
    '$scope',
    'userService',
    '$state',
    '$ionicModal',
function(
    $scope,
    userService,
    $state,
    $ionicModal
) {
    $scope.userService = userService;
	$scope.login = {
		status: false,
		phoneNum: '',
		msg: '',
		btntxt: '',
		truemsg: 'You are currently logged in as ', //apend user data
		falsemsg: 'Log in to make and view your bookings',
		truebtntxt: 'LOG OUT',
		falsebtntxt: 'LOG IN',
		errmsg: '',
		nextDisabled: true,
		submitDisabled: true,
		code: [],
		overlayHide: true
	};
	$scope.user = {
	}

	//set the Login button labels and message for Settings page
    $scope.$on('$ionicView.beforeEnter',()=>{
		$scope.login.status = (userService.sessionToken == undefined) ? false : true;

		if ($scope.login.status)
		{
			if ($state.current.name == "tab.settings") {
				var user = JSON.parse(localStorage['beelineUser']);
				$scope.user = user;

				$scope.login.btntxt = $scope.login.truebtntxt;
				$scope.login.msg = $scope.login.truemsg + $scope.user.telephone;

				$ionicModal.fromTemplateUrl('logout-modal.html', {
					scope: $scope,
					animation: 'slide-in-up'
				}).then(function(modal) {
					$scope.logoutModal = modal;
				});
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

				//grab the phone number from the User Service
				$scope.login.phoneNum = userService.mobileNo;
			
				//autofocus on first text field
				document.getElementById('c0').focus();
			}
		}
    });

	//Log in / Log out button in settings page
	$scope.logInOut = function () {
		if ($scope.login.status == false)
		{
			$state.go("tab.settings-login");
		}
		else //user logged in
		{
			$scope.logoutModal.show();
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

	//Phone number submit button clicked (error checking passed)
	$scope.phoneNumSubmit = function() {
		//Pass the phone number into the User Service.
		//$scope will be wiped clean when we enter the next screen so can't store it there
		userService.mobileNo = $scope.login.phoneNum;

		//fire and forget - send user to SMS code input page regardless of success or failure
		$state.go('tab.settings-login-verify');

		userService.sendTelephoneVerificationCode($scope.login.phoneNum).then(function(response){
			//console.log('Login Step 2...');
		}, function(error){
			alert('SMS code send error. Please try again.');
		});
	};

	//Clear all digits and set focus to first field
	$scope.focusCodeFields = function() {
		//clear the code fields and focus on first one
		document.getElementById('c0').value = '';
		document.getElementById('c1').value = '';
		document.getElementById('c2').value = '';
		document.getElementById('c3').value = '';
		document.getElementById('c4').value = '';
		document.getElementById('c5').value = '';

		$scope.login.errmsg = '';

		setTimeout(function(){
			document.getElementById('c0').focus();
		}, 300);
	}

	//Jump to next empty text input field as code digits are filled
	$scope.checkCodeFilled = function(i, last) {
		if (i < last)
		{
			var next = 'c'+(i+1);
			document.getElementById(next).focus();
		}
		else //last digit keyed
		{
			document.getElementById('c'+last).blur();
			var code = $scope.login.code.join(''); //outputs code as a string
			var numonlyreg = new RegExp('^[0-9]+$');

			//console.log(code);

			if (!numonlyreg.test(code))
			{
				$scope.login.errmsg = 'Please use numeric digits only';
			}
			else //code is OK
			{
				//add 'loading' overlay on top of everything
				$scope.login.overlayHide = false;

				$scope.login.errmsg = '';
				
				//call the API to get login token
				$scope.verifyCodeSubmit(code);
			}
		}
	};

	//Verification Code submit button
    $scope.verifyCodeSubmit = function(code) {
        userService.verifyTelephone(code).then(function(response) {
			$scope.login.overlayHide = true;

			//response is either TRUE or FALSE
			if (response) {
				//redirect user back to settings or tickets page depending on where he/she came from
				$state.go(userService.afterLoginGoWhere ?
					 userService.afterLoginGoWhere
					 : "tab.settings");
				userService.afterLoginGoWhere = undefined;
			}
			else
				$scope.login.errmsg = 'Error! Pls check your code.';

        }, function(error) { //error during submission
			//console.log(error);
			$scope.login.overlayHide = true;

			$scope.login.errmsg = 'Submission Error! Pls try again.';
		});
    };

	//Resend Verification Code
	$scope.loginCodeResend = function() {
		userService.sendTelephoneVerificationCode($scope.login.phoneNum).then(function(response){
			alert('New code sent! Please check your phone in a while.');
		}, function(error){
			alert('SMS code send error. Please try again.');
		});
	};

	//Logout OK button clicked
    $scope.logoutConfirm = function (){
        window.localStorage.removeItem('sessionToken');
        window.localStorage.removeItem('beelineUser');

        userService.sessionToken = undefined;

        $scope.logoutModal.hide();
        
        $scope.$emit('$ionicView.beforeEnter');
    };

    $scope.$on('$destroy', function() {
        if ($scope.logoutModal){
            $scope.logoutModal.remove();
        }

        if ($scope.loginFAQModal){
            $scope.loginFAQModal.remove();
        }
    });

	$scope.showBookingHistory = function() {
		console.log('show booking history');
	};
}];
