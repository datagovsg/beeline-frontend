export default function () {
  return {
    template: require('./moreInfo.html'),
    replace: false,
    scope: {
      companyId: '<',
      signageText: '<',
    },
    link: function(scope, elem, attr) {
    }
  };
}
