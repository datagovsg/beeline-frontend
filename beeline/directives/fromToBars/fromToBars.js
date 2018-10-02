import _ from 'lodash'

angular.module('beeline').directive('fromToBars', function () {
  return {
    template: require('./fromToBars.html'),
    scope: {
      dropOffLocation: '=',
      pickUpLocation: '=',
    },
    link: function (scope, elem, attr) {
      scope.disp = {}

      scope.swapFromTo = function () {
        scope.disp.animate = !scope.disp.animate;

        [scope.pickUpLocation, scope.dropOffLocation] = [_.clone(scope.dropOffLocation), _.clone(scope.pickUpLocation)]
      }
    },
  }
})
