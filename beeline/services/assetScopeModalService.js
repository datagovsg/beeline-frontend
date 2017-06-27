import commonmark from 'commonmark';

angular.module('beeline')
.service('assetScopeModalService', modalService)

function modalService($rootScope, $ionicModal, UserService, replace) {
  var reader = new commonmark.Parser({safe: true});
  var writer = new commonmark.HtmlRenderer({safe: true});
  let routePassTCModalTemplate =  require('../templates/routepass-tc-modal.html');

  function showModal(template, assetName) {
    var scope = $rootScope.$new();
    scope.error = scope.html = null;
    scope.$on('modal.shown', () => {
      UserService.beeline({
        method: 'GET',
        url: replace(`/assets/${assetName}`)
      })
      .then((response) => {
        scope.html = writer.render(reader.parse(response.data.data));
        scope.error = false;
      })
      .catch((error) => {
        console.log(error)
        scope.html = "";
        scope.error = error;
      })
    })
    var assetModal = $ionicModal.fromTemplate(
      template,
      {scope: scope}
    );
    assetModal.show();

    scope.assetModal = assetModal;
    scope.$on('modal.hidden', () => assetModal.remove())
  }

  this.showRoutePassTCModal = ()=> showModal(routePassTCModalTemplate, 'routepass-tc')
}
