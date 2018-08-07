import {range} from 'lodash'

/* Reference: http://xkjyeah.github.io/vue-google-maps/index-app.html#/03CurvedLine */
angular.module('beeline').directive('mapCurvedRoute', function () {
  return {
    replace: false,
    template: `
    <ui-gmap-polyline ng-if="curvedPath" path="curvedPath" stroke="strokeOptions" static="true"></ui-gmap-polyline>
    `,
    scope: {
      start: '<',
      end: '<',
    },
    link: function (scope, element, attributes) {
      scope.curvedPath = null
      scope.strokeOptions = {
        color: '#4b3863',
        weight: 3.0,
        opacity: 0.7,
      }

      const start = scope.start
      const end = scope.end

      scope.curvedPath = range(100)
        .map(i => {
          const tick = i / 99
          /* Bezier curve -- set up the control points */
          const dlat = end.lat - start.lat
          const dlng = end.lng - start.lng
          const cp1 = {
            lat: start.lat + 0.33 * dlat + 0.33 * dlng,
            lng: start.lng - 0.33 * dlat + 0.33 * dlng,
          }
          const cp2 = {
            lat: end.lat - 0.33 * dlat + 0.33 * dlng,
            lng: end.lng - 0.33 * dlat - 0.33 * dlng,
          }
          /* Bezier curve formula */
          return {
            latitude:
              (tick * tick * tick) * start.lat +
              3 * ((1 - tick) * tick * tick) * cp1.lat +
              3 * ((1 - tick) * (1 - tick) * tick) * cp2.lat +
              ((1 - tick) * (1 - tick) * (1 - tick)) * end.lat,
            longitude:
              (tick * tick * tick) * start.lng +
              3 * ((1 - tick) * tick * tick) * cp1.lng +
              3 * ((1 - tick) * (1 - tick) * tick) * cp2.lng +
              ((1 - tick) * (1 - tick) * (1 - tick)) * end.lng,
          }
        })
    },
  }
})
