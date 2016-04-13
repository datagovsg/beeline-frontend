
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

  //set the Login button labels and message for Settings page
  $scope.$on('$ionicView.beforeEnter', () => {
    updateUser();
  });

  //Log in / Log out button in settings page
  $scope.logIn = function () {
    UserService.logIn()
  }

  $scope.logOut = function () {
    $ionicPopup.confirm({
      title: 'Logout',
      template: 'Do you want to log out?'
    })
    .then((res) => {
      if (res) {
        UserService.logOut();
        $scope.user = null;
      }
    })
  }

  function updateUser() {
    // Really? Why not just share the UserService.currentUser object?
    UserService.getCurrentUser()
    .then((user) => {
      $scope.user = user;
    })
  }

  // Generic event handler to allow user to update their
  // name, email or telephone
  // FIXME: Get Yixin to review the user info update flow.
  $scope.updateUserInfo = function(field) {
    $ionicPopup.prompt({
      title: `Update ${field}`,
      template: `Enter your new ${field}`,
    })
    .then((newVal) => {
      if (newVal) {
        var update = {}
        update[field] = newVal;

        return UserService.beeline({
          method: 'PUT',
          url: '/user',
          data: update,
        })
        .then(() => {
          UserService.loadUserData();
          updateUser();
        })
        .catch(() => {
          $ionicPopup.alert({
            title: `Error updating ${field}`,
            template: ''
          })
        })
      }
    });
  }

  $scope.viewFAQ = function() {
    var notHttp = document.URL.indexOf( 'http://' ) === -1
          && document.URL.indexOf( 'https://' ) === -1;

    if (window.device || notHttp || window.cordova) {
      if (window.cordova.InAppBrowser) {
        window.cordova.InAppBrowser.open('http://www.beeline.sg/#faq');
      }
    }
    else {
      window.location.href = 'http://www.beeline.sg/#faq'
    }
  }

  $scope.viewPrivacyPolicy = function() {
    if (!$scope.privacyPolicyModal) {
      $scope.privacyPolicyModal = $ionicModal.fromTemplate(
        require('../templates/privacyPolicy.html')
      )
    }
    $scope.privacyPolicyModal.show();
  }

  $scope.viewContactUs = function() {
    if (!$scope.privacyPolicyModal) {
      $scope.contactUsModal = $ionicModal.fromTemplate(
        require('../templates/contactUs.html')
      )
    }
    $scope.contactUsModal.show();
  }

  $scope.$on('$destroy', () => {
    $scope.privacyPolicyModal.destroy();
  });

  $scope.showBookingHistory = function() {
    console.error("UNIMPLEMENTED STUB");
  };
}];
