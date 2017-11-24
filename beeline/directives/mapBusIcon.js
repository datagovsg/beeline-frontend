import {SafeInterval} from '../SafeInterval'
const leftPad = require('left-pad')

angular.module('beeline')
.directive('mapBusIcon', ['TripService', 'uiGmapGoogleMapApi', '$timeout', 'RotatedImage',
'LngLatDistance', 'BearingFromLngLats',
  function (TripService, uiGmapGoogleMapApi, $timeout, RotatedImage, LngLatDistance,
           BearingFromLngLats) {
    const busIconImage = new RotatedImage('./img/busTop-small.png')

    return {
      replace: false,
      restrict: 'E',
      template: `
      <ui-gmap-marker ng-if="icon"
                      coords="coordinates"
                      idkey="idkey"
                      icon="icon"></ui-gmap-marker>
      `,
      scope: {
        pings: '<',
        idkey: '<',
        overlay: '<',
      },
      controller: ['$scope', function ($scope) {
        $scope.bearing = null
        $scope.busIcon = null
        $scope.icon = null

        /**
          Here's the algorithm:

          1. For each bus, establish the direction
              a) Take the first two pings
              b) If the distance isn't big enough to be
                 certain of the direction, add another ping. Repeat
          2. Draw the icon based on the direction

          This function also caches the previous known angle and
          avoids re-rendering the image
          */
        const now = Date.now()

        busIconImage.imageLoadPromise.then(() => $scope.$digest())

        $scope.$watchGroup(['pings', () => (typeof google !== 'undefined') && (busIconImage.loaded)],
                           ([pings, gapi]) => {
          // Do not update if google maps is not loaded (we need Size and Point)
          // Do not update if bus icon image is not loaded yet
          if (!gapi || !pings) return
          const bearing = bearingFromPings(pings)
          const oldLocationStatus = $scope.locationStatus && $scope.locationStatus[index]

          const busIcon = ($scope.busIcon && $scope.bearing !== null &&
                  Math.abs($scope.bearing - bearing) < 0.1) ?
              $scope.busIcon : busIconImage.rotate(bearing, $scope.overlay || '')

          $scope.busIcon = busIcon
          $scope.icon = {
            url: busIcon,
            scaledSize: new google.maps.Size(80, 80),
            anchor: new google.maps.Point(40, 40),
          }

          $scope.coordinates = (pings.length > 0) ? pings[0].coordinates : null
          $scope.bearing = bearing
        })
      }],
    }

    function bearingFromPings (pings) {
      if (pings.length < 2) {
        return 0.75 * 2 * Math.PI // DEFAULT - 270°
      }

      const firstPingLngLat = pings[0].coordinates.coordinates
      for (let i=1; i<pings.length; i++) {
        const lastPingLngLat = pings[i].coordinates.coordinates
        if (LngLatDistance(firstPingLngLat, lastPingLngLat) >= 50
              || i === pings.length - 1) {
          return BearingFromLngLats(firstPingLngLat, lastPingLngLat)
        }
      }
    }
  }]
)
