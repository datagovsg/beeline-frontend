import moment from "moment"

angular.module("beeline").directive("countdown", [
  "$interval",
  function($interval) {
    return {
      scope: {
        boardTime: "<",
        bookingEnds: "=",
      },
      template: `
      <div>
        <span ng-if="minsBeforeClose && minsBeforeClose <= 30 && minsBeforeClose >=1 0" class="notes">Booking for the next trip closes in {{minsBeforeClose | number: 0}} mins.</span>
        <span ng-if="minsBeforeClose && 0 < minsBeforeClose < 1">Booking for the next trip closes in less than 1 minute.</span>
        <span ng-if="bookingEnds" class="notes" >Booking for the next trip has ended.</span>
      </div>
      `,
      link(scope, elem, attr) {
        let stopTime // so that we can cancel the time updates

        // used to update the UI
        const updateTime = function updateTime() {
          scope.minsBeforeClose = moment(scope.boardTime).diff(
            moment(Date.now()),
            "minutes",
            true
          )
        }

        scope.$watch("boardTime", bt => {
          if (bt && !stopTime) {
            scope.bookingEnds = false
            stopTime = $interval(updateTime, 100 * 30)
            updateTime()
          }
        })

        // watch the expression, and update the UI on change.
        scope.$watch("minsBeforeClose", function(value) {
          if (value <= 0) {
            scope.bookingEnds = true
            $interval.cancel(stopTime)
          }
        })

        // listen on DOM destroy (removal) event, and cancel the next UI update
        // to prevent updating time after the DOM element was removed.
        scope.$on("$destroy", function() {
          $interval.cancel(stopTime)
        })
      },
    }
  },
])
