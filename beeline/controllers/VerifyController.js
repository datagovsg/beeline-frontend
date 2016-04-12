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
      showOverlay: false,
    };

    //set the Login button labels and message for Settings page
    $scope.$on('$ionicView.afterEnter',() => {
      // Reset data
      $scope.login.code = new Array(6);
      $scope.login.telephone = UserService.telephone || '';
    });

    $scope.resend = function($event) {
      $event.preventDefault();

      // Don't allow user to request another code within the next 30 sec
      $scope.login.resendTimeout = true
      $timeout(() => {
        $scope.login.resendTimeout = false;
      }, 30000);

      // Send the code
      UserService.sendTelephoneVerificationCode(UserService.telephone)
      .then(() => {
        $ionicPopup.alert('New code sent! Please check your phone in a while.');
      }, function(error){
        $ionicPopup.alert('There was a problem sending the SMS code. Please try again later.');
      });
    }

  	//Clear all digits and set focus to first field
  	$scope.focusCodeFields = function(e) {
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
        var digitsOnly = /^[0-9]+/;

        if (!digitsOnly.test(code))
        {
          $scope.login.errorMessage = 'Please use numeric digits only';
        }
        else //code is OK
        {
          $scope.login.errorMessage = '';

          //call the API to get login token
          $scope.verifyCodeSubmit(code);
        }
      }
    };

  	//Verification Code submit button
    $scope.verifyCodeSubmit = function(code) {
      $scope.login.showOverlay = true;
      UserService.verifyTelephone(code)
      .then(function(response) {
          if (response) {
            window.localStorage.sessionToken = UserService.sessionToken;
      			UserService.afterLogin();
          }
          else {
            $scope.login.errorMessage = "The code you submitted is incorrect. Please try again."
          }
        }, function(error) { //error during submission
          $ionicPopup.alert("There was an error submitting the code");
    		})
      .then(() => {
          $scope.login.showOverlay = false;
        });
    };
  }
];
