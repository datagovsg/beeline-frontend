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

        // Four columns. If changing number of cols, CSS also needs
        // to be changed
        scope.times = makeGrid(times, 4)
      },
    }
  },
])

function makeGrid(data, cols) {
  let grid = []
  let col
  let row = -1

  for (let i = 0; i < data.length; i++) {
    col = i % cols
    if (col === 0) {
      grid[++row] = []
    }
    grid[row][col] = data[i]
  }
  return grid
}
