import privacyPolicyModalTemplate from '../templates/privacy-policy-modal.html';
import termsOfUseModalTemplate from '../templates/terms-of-use-modal.html';

export default function ($rootScope, $ionicModal) {

  function showModal(template) {
    var scope = $rootScope.$new();
    var modal = $ionicModal.fromTemplate(
      template,
      {scope: scope}
    );
    modal.show();

    scope.modal = modal;
    scope.$on('modal.hidden', () => modal.remove())
  }

  this.showPrivacyPolicy = () => showModal(privacyPolicyModalTemplate)
  this.showTermsOfUse = () => showModal(termsOfUseModalTemplate)

}
