import privacyPolicyModalTemplate from '../templates/privacy-policy-modal.html';
import termsOfUseModalTemplate from '../templates/terms-of-use-modal.html';

export default function ($rootScope, $ionicModal) {

  function buildModal(template) {
    var scope = $rootScope.$new();
    var modal = $ionicModal.fromTemplate(
      template,
      {scope: scope}
    );
    scope.modal = modal;
    return {
      show() {
        modal.show();
      }
    }
  }

  var privacyPolicyModal = buildModal(privacyPolicyModalTemplate)
    , termsOfUseModal = buildModal(termsOfUseModalTemplate);

  this.showPrivacyPolicy = () => privacyPolicyModal.show();
  this.showTermsOfUse = () => termsOfUseModal.show();

}
