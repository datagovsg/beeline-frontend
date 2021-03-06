import liteRouteStopTemplate from './liteRouteStop.html'
import moment from 'moment-timezone'
import _ from 'lodash'

angular.module('beeline').directive('liteRouteStop', [
  function () {
    return {
      replace: false,
      template: liteRouteStopTemplate,
      scope: {
        stop: '<?',
        index: '<?',
        current: '<?',
      },
      link: function (scope, element, attributes) {
        scope.currentTime = moment()
        let times = scope.stop.time.map(time => {
          return moment(time)
        })

        scope.after = times.filter(time => time >= scope.currentTime)

        // Four columns. If changing number of cols, CSS also needs
        // to be changed
        scope.times = _.chunk(times, 4)

        if (scope.stop.canBoard && !scope.stop.canAlight) {
          scope.stopTypeText = 'Pick up only'
        } else if (!scope.stop.canBoard && scope.stop.canAlight) {
          scope.stopTypeText = 'Drop off only'
        }
      },
    }
  },
])
