angular.module("beeline").directive("fakeProgressBar", [
  "$timeout",
  function($timeout) {
    return {
      template: `
        <progress class="fakeProgressBar" max="100" value={{progressValue}}></progress>
      `,
      scope: {
        interval: "<",
        max: "<",
      },
      link(scope, elem, attr) {
        scope.progressValue = 0
        let timeout
        let makeProgress = function() {
          scope.progressValue = (scope.progressValue + 1) % (scope.max + 1)
          timeout = $timeout(makeProgress, scope.interval)
        }
        makeProgress()
        scope.$on("$destroy", () => $timeout.cancel(timeout))
      },
    }
  },
])
