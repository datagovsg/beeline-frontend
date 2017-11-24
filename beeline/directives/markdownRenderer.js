import commonmark from 'commonmark'

let reader = new commonmark.Parser({safe: true})
let writer = new commonmark.HtmlRenderer({safe: true})

export default function () {
  return {
    replace: true,
    template: '<div ng-bind-html="markdownHTML"></div>',
    scope: {
      data: '<',
    },
    link: function (scope, element, attributes) {
      scope.$watch('data', (data) => {
        scope.markdownHTML = data && writer.render(reader.parse(data))
      })
    },
  }
}
