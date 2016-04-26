import faqModalTemplate from '../templates/faq-modal.html';
import privacyPolicyModalTemplate from '../templates/privacy-policy-modal.html';
import contactUsModalTemplate from '../templates/contact-us-modal.html';

export default [
  '$scope',
  'UserService',
  '$ionicModal',
  '$ionicPopup',
  function(
    $scope,
    UserService,
    $ionicModal,
    $ionicPopup
  ) {
    $scope.data = {}

    // Track the login state of the user service
    $scope.$watch(function() {
      return UserService.user;
    }, function(newUser) {
      $scope.user = UserService.user;
    });
    
    // Map in the login items
    $scope.logIn = function() { UserService.logIn(); };
    $scope.logOut = function() { 
      $ionicPopup.confirm({
        title: "Are you sure you want to log out?",
        subTitle: "You won't be able to see your upcoming trips or make new bookings."
      }).then(function(response) {
        if (response) UserService.logOut();
      });
    };

    // Generic event handler to allow user to update their
    // name, email
    // FIXME: Get Yixin to review the user info update flow.
    $scope.updateUserInfo = function(field) {
      $ionicPopup.prompt({
        title: `Update ${field}`,
        template: `Enter your new ${field}`,
      })
      .then((newVal) => {
        if (newVal) {
          var update = {};
          update[field] = newVal;
          return UserService.updateUserInfo(update)
          .catch(() => {
            $ionicPopup.alert({
              title: `Error updating ${field}`,
              template: ''
            })
          });
        }
      });
    }

    // Update telephone is distinct from the update user due to verification
    $scope.updateTelephone = function () {
      // Start by prompting the user for the desired new telephone number
      $ionicPopup.prompt({
        title: `Update telephone`,
        template: `Enter your new telephone number:`,
      })
      // Wait for the update token and verification key
      .then((telephone) => {
        if (telephone) {
          var requestUpdatePromise = UserService.requestUpdateTelephone(telephone);
          var verificationPromptPromise = $ionicPopup.prompt({
            title: `Enter verification key`,
            template: `Please enter the verification key you receive by SMS:`,
          });
          return Promise.all([requestUpdatePromise, verificationPromptPromise])
          .then(function(values){
            var updateToken = values[0];
            var verificationKey = values[1];
            return UserService.updateTelephone(updateToken, verificationKey);
          });
        }
      })
      // Generic error if something goes wrong
      .catch((error) => {
        $ionicPopup.alert({
          title: 'Error',
          template: `There was a problem updating your telephone: ${error.status}`
        })
      });
    }

    // Configure modals
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
