export default [
  "$rootScope",
  "$ionicModal",
  function Legalese($rootScope, $ionicModal) {
    let privacyPolicyModalTemplate = require("../templates/" +
      $rootScope.o.APP.PREFIX +
      "privacy-policy-modal.html")
    let termsOfUseModalTemplate = require("../templates/" +
      $rootScope.o.APP.PREFIX +
      "terms-of-use-modal.html")

    function showModal(template) {
      return new Promise((resolve, reject) => {
        let scope = $rootScope.$new()
        let modal = $ionicModal.fromTemplate(template, { scope: scope })
        modal.show()

        scope.modal = modal
        scope.$on("modal.hidden", () => {
          return resolve(modal.remove())
        })
      })
    }

    this.showPrivacyPolicy = () => showModal(privacyPolicyModalTemplate)
    this.showTermsOfUse = () => showModal(termsOfUseModalTemplate)
  },
]
