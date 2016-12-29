import progressBar from './progressBar.html';

export default [
  function() {
    return {
      restrict: 'E',
      template: progressBar,
      scope: {
        backer1: '<',
        pax1: '<',
        price1: '<',
        detail: '<',
        needed: '<',
      },
      link: function(scope, elem, attr) {
        scope.$watchGroup(['backer1', 'pax1'], () => {
          scope.percentage = Math.min((scope.backer1/scope.pax1), 1);
          // if (!isFinite(scope.moreNeeded))
          //   scope.moreNeeded = '';
        })
      }
    }
  }
]
