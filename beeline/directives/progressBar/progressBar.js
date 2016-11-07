import progressBar from './progressBar.html';

export default [
  function() {
    return {
      restrict: 'E',
      template: progressBar,
      scope: {
        backer1: '@',
        pax1: '@',
        price1: '@',
        detail: '@',
      },
    }
  }
]
