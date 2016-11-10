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
      },
      link: function(scope, elem, attr) {
        scope.$watchGroup(['backer1', 'pax1'], () => {
          scope.moreNeeded = Math.max((scope.pax1-scope.backer1), 0);

          if (!isFinite(scope.moreNeeded))
            scope.moreNeeded = '';
          console.log(scope.moreNeeded)
        })
      }
    }
  }
]
