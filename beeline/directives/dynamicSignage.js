export default function() {
  return {
    replace: false,
    template: `
    <div>{{signageText}}</div>
    `,
    scope: {
      'signageText': '@signageText',
    },
    link: function(scope, element, attributes) {
    },
  };
}
