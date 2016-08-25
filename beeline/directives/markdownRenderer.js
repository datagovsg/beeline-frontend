import commonmark from 'commonmark';

var reader = new commonmark.Parser({safe: true});
var writer = new commonmark.HtmlRenderer({safe: true});

export default function() {
  return {
    replace: true,
    template: '<div ng-bind-html="markdownHTML"></div>',
    scope: {
      data: '<',
    },
    link: function(scope, element, attributes) {
      scope.$watch('data', (data) => {
        scope.markdownHTML = data && writer.render(reader.parse(data));
      })
    },
  };
}
