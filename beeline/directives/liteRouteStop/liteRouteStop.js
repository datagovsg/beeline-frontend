import liteRouteStopTemplate from "./liteRouteStop.html"
import moment from "moment"

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
      },
    }
  },
])
