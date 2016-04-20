var privacyPolicyTemplate = require('../templates/privacyPolicy.html')
var contactUsTemplate = require('../templates/contactUs.html')

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
  $scope.data = {
    user: null
  }

  $scope.$watch(() => UserService.getCurrentUser(), () => {
    UserService.getCurrentUser().then((user) => {
      $scope.data.user = user;
    })
  })

  // //set the Login button labels and message for Settings page
  // $scope.$on('$ionicView.beforeEnter', () => {
  //   updateUser();
  // });

  $scope.updateTelephone = function () {
    $ionicPopup.prompt({
      title: `Update telephone`,
      template: `Enter your new telephone number:`,
    })
    .then((telephone) => {
      if (telephone) {
        var updateToken;

        return UserService.requestUpdateTelephone(telephone)
        .then((upd) => {
          updateToken = upd;

          return $ionicPopup.prompt({
            title: `Enter verification key`,
            template: `Please enter the verification key you receive by SMS:`,
          })
        })
        .then((verificationKey) => {
          if (verificationKey) {
            return UserService.updateTelephone(updateToken, verificationKey)
          }
        })
      }
    })
    .catch((error) => {
      console.log(error);
      $ionicPopup.alert({
        title: 'Error',
        template: `There was a problem updating your telephone: ${error.status}`
      })
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

        return UserService.updateUserInfo(update)
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
    throw new Error('UNIMPLEMENTED');
    // var notHttp = !document.URL.startsWith('http://') &&
    //   !document.URL.startsWith('https://')

    // if (window.device || notHttp || window.cordova) {
    //   if (window.cordova.InAppBrowser) {
    //     window.cordova.InAppBrowser.open('http://www.beeline.sg/#faq', '_blank');
    //   }
    // }
    // else {
    //   window.location.href = 'http://www.beeline.sg/#faq'
    // }
  }

  $scope.viewPrivacyPolicy = function() {
    if (!$scope.privacyPolicyModal) {
      $scope.privacyPolicyModal = $ionicModal.fromTemplate(
        privacyPolicyTemplate,
        {
          scope: $scope,
        }
      )
    }
    $scope.privacyPolicyModal.show();
  }

  $scope.viewContactUs = function() {
    if (!$scope.contactUsModal) {
      $scope.contactUsModal = $scope.contactUsModal || $ionicModal.fromTemplate(
        contactUsTemplate,
        {
          scope: $scope,
        }
      )
    }
    $scope.contactUsModal.show();
  }

  $scope.$on('$destroy', () => {
    $scope.privacyPolicyModal.destroy();
    $scope.contactUsModal.destroy();

    $scope.privacyPolicyModal = null;
    $scope.contactUsModal = null;
  });

  $scope.showBookingHistory = function() {
    console.error("UNIMPLEMENTED STUB");
  };
}];
