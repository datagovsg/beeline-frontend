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
    $scope.UserService = UserService;

    $scope.login = {
      telephone: UserService.telephone || '',
      errorMessage: '',
    };

    //Set up the FAQ modal
    $ionicModal.fromTemplateUrl('login-faq.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.loginFAQModal = modal;
    });

    //Phone Number submission
    $scope.eightDigitNumber = /^[0-9]{8}$/;

    $scope.submit = function() {
      UserService.logOut();
      UserService.telephone = $scope.login.telephone;
      UserService.sendTelephoneVerificationCode(UserService.telephone)
      .then(function(response) {
        //send user to SMS code input page
        $state.go('login-verify');
      }, function(error){
        $ionicPopup.alert({
          title: 'Error',
          template: 'There was a problem sending the SMS code. Please try again later.',
        });
      });
    };
  }
];
