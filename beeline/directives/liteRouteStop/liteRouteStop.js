import liteRouteStopTemplate from "./liteRouteStop.html"
import moment from "moment"
import _ from "lodash"

angular.module("beeline").directive("liteRouteStop", [
  function() {
    return {
      replace: false,
      template: liteRouteStopTemplate,
      scope: {
        stop: "<?",
        index: "<?",
        current: "<?",
      },
      link: function(scope, element, attributes) {
        scope.currentTime = moment()
        let times = scope.stop.time.map(time => {
          return moment(time)
        })
        scope.before = times
          .filter(time => time < scope.currentTime)
          .map(time => time.format("h:mm a"))
        scope.after = times
          .filter(time => time >= scope.currentTime)
          .map(time => time.format("h:mm a"))

        // Four columns. If changing number of cols, CSS also needs
        // to be changed
        scope.times = _.chunk(times, 4)

        if (scope.stop.canBoard && !scope.stop.canAlight) {
          scope.stopTypeText = "Pick up only"
        } else if (!scope.stop.canBoard && scope.stop.canAlight) {
          scope.stopTypeText = "Drop off only"
        }
      },
    }
  },
])
