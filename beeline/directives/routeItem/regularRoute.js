angular.module('beeline').directive('regularRoute', function () {
  return {
    template: require('./regularRoute.html'),
    scope: {
      route: '<',
    },
  }
})
