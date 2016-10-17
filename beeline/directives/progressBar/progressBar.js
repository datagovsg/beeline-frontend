import progressBar from './progressBar.html';

export default [
  function() {
    return {
      restrict: 'E',
      template: progressBar,
      scope: {
        curVal: '@',
        maxVal: '@',
        secondVal: '@',
        highPrice: '@',
        lowPrice: '@'
      },
      link: function(scope, elem, attr) {

        function updateProgress() {
          var progress,secProgress = 0;

          if (scope.maxVal) {
            progress = Math.min(scope.curVal, scope.maxVal) / scope.maxVal * elem[0].querySelector('.fullBar').offsetWidth;
            secProgress = Math.min(scope.secondVal, scope.maxVal) / scope.maxVal * elem[0].querySelector('.fullBar').offsetWidth;
            console.log("BAR");
            console.log(progress);
            console.log(secProgress);
          }

          // elem[0].querySelector('.highBid').css('width', progress);
          elem[0].querySelector('.highBid').style.width = progress+"px";
          // elem[0].querySelector('.lowBid').css('width', secProgress);
          elem[0].querySelector('.lowBid').style.width = secProgress+"px";
        }

        scope.$watchGroup(['curVal','secVal','maxVal'], updateProgress);
      }
    }
  }
]
