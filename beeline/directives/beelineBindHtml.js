

export default function () {
  return {
    restrict: 'A',
    scope: false,
    link(scope, elem, attrs) {
      scope.$watch(attrs.beelineBindHtml, (html) => {
        elem[0].innerHTML = html || '';

        angular.forEach(elem.find('a'), (value, key) => {
          if (!value.href) return;

          value.target = '_system';
        })
      })
    }
  }
}
