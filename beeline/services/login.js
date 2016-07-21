import loginModalTemplate from '../templates/login-modal.html';
const VALID_PHONE_REGEX = /^[8-9]{1}[0-9]{7}$/;

export default function ($rootScope, $ionicModal, Legalese) {
  var scope = $rootScope.$new();

  var loginModal = $ionicModal.fromTemplate(
    loginModalTemplate,
    {scope: scope}
  );

  scope.modal = loginModal;
  scope.phonePattern = VALID_PHONE_REGEX;
  scope.showPrivacyPolicy = () => Legalese.showPrivacyPolicy();
  scope.showTermsOfUse = () => Legalese.showTermsOfUse();

  scope.$on('modal.hidden', () => {
    if (scope.reject)
      scope.reject();
    scope.accept = scope.reject = null;
  })

  this.show = () => {
    scope.data = {};
    scope.form = {};

    return new Promise((resolve, reject) => {
      scope.accept = () => {
        scope.accept = scope.reject = null;
        loginModal.hide();
        resolve(scope.data.telephone);
      };
      loginModal.show();
    })
  }
}
