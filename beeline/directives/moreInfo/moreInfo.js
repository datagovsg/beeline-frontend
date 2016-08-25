export default function () {
  return {
    template: require('./moreInfo.html'),
    replace: false,
    scope: {
      companyId: '<',
    },
    link: function(scope, elem, attr) {
    }
  };
}
