import faqModalTemplate from '../templates/faq-modal.html';
import privacyPolicyModalTemplate from '../templates/privacy-policy-modal.html';
import termsOfUseModalTemplate from '../templates/terms-of-use-modal.html';
import contactUsModalTemplate from '../templates/contact-us-modal.html';
import commonmark from 'commonmark';

var reader = new commonmark.Parser({safe: true});
var writer = new commonmark.HtmlRenderer({safe: true});

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

    // Load the pages only when requested.
    function assetScope(assetName) {
      var newScope = $scope.$new();
      newScope.data = null;
      newScope.$on('modal.shown', () => {
        UserService.beeline({
          method: 'GET',
          url: `/assets/${assetName}`
        })
        .then((response) => {
          newScope.html = writer.render(reader.parse(response.data.data));
          newScope.error = false;
        })
        .catch((error) => {
          console.log(error)
          newScope.html = "";
          newScope.error = error;
        })
      })
      return newScope;
    }

    $scope.faqModal = $ionicModal.fromTemplate(
      faqModalTemplate,
      {scope: assetScope('FAQ')}
    );
    $scope.privacyPolicyModal = $ionicModal.fromTemplate(
      privacyPolicyModalTemplate,
      {scope: $scope}
    );
    $scope.termsOfUseModal = $ionicModal.fromTemplate(
      termsOfUseModalTemplate,
      {scope: $scope}
    );
    $scope.contactUsModal = $ionicModal.fromTemplate(
      contactUsModalTemplate,
      {scope: $scope}
    );
    $scope.$on('$destroy', function() {
      $scope.faqModal.destroy();
      $scope.privacyPolicyModal.destroy();
      $scope.termsOfUseModal.destroy();
      $scope.contactUsModal.destroy();
    });

  }];
