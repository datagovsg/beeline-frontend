export default function ($rootScope, $ionicModal) {
  let prefix = $rootScope.o.app && $rootScope.o.app.prefix ? $rootScope.o.app.prefix+'-' : '';
  let privacyPolicyModalTemplate =  require('../templates/'+prefix+'privacy-policy-modal.html');
  let termsOfUseModalTemplate =  require('../templates/'+prefix+'terms-of-use-modal.html');

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
