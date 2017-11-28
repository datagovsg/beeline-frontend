import commonmark from "commonmark"

angular
  .module("beeline")
  .service("assetScopeModalService", [
    "$rootScope",
    "$ionicModal",
    "UserService",
    "replace",
    modalService,
  ])

function modalService($rootScope, $ionicModal, UserService, replace) {
  let reader = new commonmark.Parser({ safe: true })
  let writer = new commonmark.HtmlRenderer({ safe: true })
  let routePassTCModalTemplate = require("../templates/routepass-tc-modal.html")

  function showModal(template, assetName) {
    let scope = $rootScope.$new()
    scope.error = scope.html = null
    scope.$on("modal.shown", () => {
      UserService.beeline({
        method: "GET",
        url: replace(`/assets/${assetName}`),
      })
        .then(response => {
          scope.html = writer.render(reader.parse(response.data.data))
          scope.error = false
        })
        .catch(error => {
          console.log(error)
          scope.html = ""
          scope.error = error
        })
    })
    let assetModal = $ionicModal.fromTemplate(template, { scope: scope })
    assetModal.show()

    scope.assetModal = assetModal
    scope.$on("modal.hidden", () => assetModal.remove())
  }

  this.showRoutePassTCModal = () =>
    showModal(routePassTCModalTemplate, "routepass-tc")
}
