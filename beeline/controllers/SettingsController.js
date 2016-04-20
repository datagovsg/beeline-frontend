import faqModalTemplate from '../templates/faq-modal.html';
import privacyPolicyModalTemplate from '../templates/privacy-policy-modal.html';
import contactUsModalTemplate from '../templates/contact-us-modal.html';

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
    $scope.data = {}

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

    // TODO Implement this
    $scope.showBookingHistory = function() {
      alert("unimplemented stub");
    };

    $scope.faqModal = $ionicModal.fromTemplate(
      faqModalTemplate,
      { scope: $scope }
    );
    $scope.privacyPolicyModal = $ionicModal.fromTemplate(
      privacyPolicyModalTemplate,
      { scope: $scope }
    );
    $scope.contactUsModal = $ionicModal.fromTemplate(
      contactUsModalTemplate,
      { scope: $scope }
    );

    $scope.$on('$destroy', function() {
      $scope.faqModal.destroy();
      $scope.privacyPolicyModal.destroy();
      $scope.contactUsModal.destroy();
    });

  }];
