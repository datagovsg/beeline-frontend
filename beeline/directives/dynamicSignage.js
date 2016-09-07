export default function() {
  return {
    replace: false,
    template: `
    <div>{{signageText}}</div>
    `,
    scope: {
      'signageText': '<',
    },
    link: function(scope, element, attributes) {
    },
  };
}
