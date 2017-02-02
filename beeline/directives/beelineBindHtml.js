

export default function ($compile) {
  return {
    restrict: 'A',
    scope: false,
    link(scope, elem, attrs) {
      scope.$watch(attrs.beelineBindHtml, (html) => {
        elem[0].innerHTML = html || '';

        scope.$openOpenLink = (href) => {
          if (typeof cordova !== 'undefined') {
            cordova.InAppBrowser.open(href, '_system');
          }
          else {
            window.open(href, '_blank');
          }
        };

        angular.forEach(elem.find('a'), (value, key) => {
          if (!value.href) return;

          value.setAttribute("ng-click", `$openOpenLink(${JSON.stringify(value.href)})`)

          $compile(value)(scope);
        })
      })
    }
  }
}
