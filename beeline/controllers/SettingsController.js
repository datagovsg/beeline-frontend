import faqModalTemplate from '../templates/faq-modal.html';
import privacyPolicyModalTemplate from '../templates/privacy-policy-modal.html';
import contactUsModalTemplate from '../templates/contact-us-modal.html';

export default [
  '$scope',
  'UserService',
  '$ionicModal',
  '$ionicPopup',
  '$timeout',
  function(
    $scope,
    UserService,
    $ionicModal,
    $ionicPopup,
    $timeout
  ) {
    $scope.data = {};

    // Track the login state of the user service
    $scope.$watch(function() {
      return UserService.getUser();
    }, function(newUser) {
      $scope.user = newUser;
    });

    // Map in the login items
    $scope.logIn = UserService.promptLogIn;
    $scope.logOut = UserService.promptLogOut;

    // Generic event handler to allow user to update their
    // name, email
    // FIXME: Get Yixin to review the user info update flow.
    $scope.updateUserInfo = function(field){
      return UserService.promptUpdateUserInfo(field);
    }

    // Update telephone is distinct from the update user due to verification
    $scope.updateTelephone = UserService.promptUpdatePhone;

    // Configure modals
    $scope.faqModal = $ionicModal.fromTemplate(
      faqModalTemplate,
      {scope: $scope}
    );
    $scope.privacyPolicyModal = $ionicModal.fromTemplate(
      privacyPolicyModalTemplate,
      {scope: $scope}
    );
    $scope.contactUsModal = $ionicModal.fromTemplate(
      contactUsModalTemplate,
      {scope: $scope}
    );
    $scope.$on('$destroy', function() {
      $scope.faqModal.destroy();
      $scope.privacyPolicyModal.destroy();
      $scope.contactUsModal.destroy();
    });

  }];
