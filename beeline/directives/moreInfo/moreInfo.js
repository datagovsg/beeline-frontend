export default function () {
  return {
    template: require('./moreInfo.html'),
    replace: false,
    scope: {
      companyId: '<',
      features: '<',
    },
    link: function(scope, elem, attr) {
    }
  };
}
