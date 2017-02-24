import loginModalTemplate from '../templates/login-modal.html';
const VALID_PHONE_REGEX = /^[8-9]{1}[0-9]{7}$|^########$/;

export default function ($rootScope, $ionicModal, Legalese) {
  this.show = () => {
    var scope = $rootScope.$new();
    var loginModal = $ionicModal.fromTemplate(
      loginModalTemplate,
      {scope: scope}
    );

    scope.modal = loginModal;
    scope.phonePattern = VALID_PHONE_REGEX;
    scope.showPrivacyPolicy = () => Legalese.showPrivacyPolicy();
    scope.showTermsOfUse = () => Legalese.showTermsOfUse();

    scope.data = {};
    scope.form = {};

    function cleanup() {
      loginModal.remove();
    }

    var loginPromise = new Promise((resolve, reject) => {
      scope.$on('modal.hidden', () => {
        if (scope.reject)
          scope.reject(null);
        scope.accept = scope.reject = null;
      })

      scope.reject = resolve;

      scope.accept = () => {
        scope.accept = scope.reject = null;
        loginModal.hide();
        // returns [ telephone-number, want-telephone-verification ]
        resolve([scope.data.telephone, true]);
      };

      scope.bypass = () => {
        scope.accept = scope.reject = null;
        loginModal.hide();
        // returns [ telephone-number, want-telephone-verification ]
        resolve([scope.data.telephone, false]);
      };

      loginModal.show();
    })

    loginPromise.then(cleanup, cleanup);

    return loginPromise;
  }
}
