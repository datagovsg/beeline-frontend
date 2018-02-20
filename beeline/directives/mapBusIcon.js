angular.module("beeline").directive("mapBusIcon", [
  "RotatedImage",
  function(RotatedImage) {
    const busIconImage = new RotatedImage("./img/busTop-small.png")

    return {
      replace: false,
      restrict: "E",
      template: `
      <ui-gmap-marker ng-if="icon"
                      coords="coordinates"
                      idkey="idkey"
                      icon="icon"></ui-gmap-marker>
      `,
      scope: {
        pings: "<",
        idkey: "<",
        overlay: "<",
      },
      controller: [
        "$scope",
        function($scope) {
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
          busIconImage.imageLoadPromise.then(() => $scope.$digest())

          $scope.$watchGroup(
            [
              "pings",
              () => typeof google !== "undefined" && busIconImage.loaded,
            ],
            ([pings, gapi]) => {
              // Do not update if google maps is not loaded (we need Size and Point)
              // Do not update if bus icon image is not loaded yet
              if (!gapi || !pings) return
              const bearing = bearingFromPings(pings)

              const busIcon =
                $scope.busIcon &&
                $scope.bearing !== null &&
                Math.abs($scope.bearing - bearing) < 0.1
                  ? $scope.busIcon
                  : busIconImage.rotate(bearing, $scope.overlay || "")

              $scope.busIcon = busIcon
              $scope.icon = {
                url: busIcon,
                scaledSize: new google.maps.Size(80, 80),
                anchor: new google.maps.Point(40, 40),
              }

              $scope.coordinates =
                pings.length > 0 ? pings[0].coordinates : null
              $scope.bearing = bearing
            }
          )
        },
      ],
    }

    function bearingFromPings(pings) {
      if (pings.length < 2) {
        return 0.75 * 2 * Math.PI // DEFAULT - 270°
      }

      const firstPingLngLat = pings[0].coordinates.coordinates
      for (let i = 1; i < pings.length; i++) {
        const lastPingLngLat = pings[i].coordinates.coordinates
        if (
          lngLatDistance(firstPingLngLat, lastPingLngLat) >= 50 ||
          i === pings.length - 1
        ) {
          return bearingFromLngLats(firstPingLngLat, lastPingLngLat)
        }
      }
    }

    function lngLatDistance(ll1, ll2) {
      let rr1 = [ll1[0] / 180 * Math.PI, ll1[1] / 180 * Math.PI]
      let rr2 = [ll2[0] / 180 * Math.PI, ll2[1] / 180 * Math.PI]

      let dx = (rr1[0] - rr2[0]) * Math.cos(0.5 * (rr1[1] + rr2[1]))
      let dy = rr1[1] - rr2[1]

      let dist = Math.sqrt(dx * dx + dy * dy) * 6371000
      return dist
    }

    function bearingFromLngLats(ll1, ll2) {
      let rr1 = [ll1[0] / 180 * Math.PI, ll1[1] / 180 * Math.PI]
      let rr2 = [ll2[0] / 180 * Math.PI, ll2[1] / 180 * Math.PI]

      let dx = (rr2[0] - rr1[0]) * Math.cos(0.5 * (rr1[1] + rr2[1]))
      let dy = rr2[1] - rr1[1]

      return Math.atan2(dx, dy)
    }
  },
])
