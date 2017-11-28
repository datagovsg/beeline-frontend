import { SafeInterval } from "../SafeInterval"

angular.module("beeline").directive("mapBusPolyRoute", [
  "TripService",
  "uiGmapGoogleMapApi",
  "$timeout",
  "RotatedImage",
  "LngLatDistance",
  "BearingFromLngLats",
  function(
    TripService,
    uiGmapGoogleMapApi,
    $timeout,
    RotatedImage,
    LngLatDistance,
    BearingFromLngLats
  ) {
    return {
      replace: false,
      restrict: "E",
      template: `
      <map-bus-icon ng-repeat="recentPings in allRecentPings track by $index"
                    idkey="'bus-icon' + $index"
                    ng-if="recentPings.isRecent"
                    pings="recentPings.pings"
                    overlay="$index + 1"></map-bus-icon>
      `,
      scope: {
        availableTrips: "<",
        hasTrackingData: "=?",
        routeMessage: "=?",
      },
      controller: [
        "$scope",
        function($scope) {
          $scope.map = {
            busLocations: [
              {
                coordinates: null,
                icon: null,
              },
            ],
          }

          $scope.statusMessages = []

          $scope.$watchCollection("statusMessages", () => {
            $scope.routeMessage = $scope.statusMessages.join(" ")
          })

          // fetch driver pings every 4s
          $scope.timeout = new SafeInterval(pingLoop, 4000, 1000)

          $scope.$on("killPingLoop", () => {
            $scope.timeout.stop()
          })

          $scope.$on("startPingLoop", () => {
            $scope.timeout.start()
          })

          // load icons and path earlier by restart timeout on watching trips
          $scope.$watchCollection("availableTrips", () => {
            $scope.timeout.stop()
            $scope.timeout.start()
          })

          async function pingLoop() {
            if (!$scope.availableTrips) return

            $scope.statusMessages = $scope.statusMessages || []
            $scope.allRecentPings = $scope.allRecentPings || []

            $scope.statusMessages.length = $scope.allRecentPings.length =
              $scope.availableTrips.length

            await Promise.all(
              $scope.availableTrips.map((trip, index) => {
                return TripService.driverPings(trip.id).then(info => {
                  const now = Date.now()

                  $scope.allRecentPings[index] = {
                    ...info,
                    isRecent:
                      info.pings[0] &&
                      now - info.pings[0].time.getTime() < 5 * 60000,
                  }

                  $scope.statusMessages[index] = _.get(
                    info,
                    "statuses[0].message",
                    null
                  )
                })
              })
            )
            // to mark no tracking data if no ping or pings are too old
            if (_.every($scope.allRecentPings, { isRecent: undefined })) {
              $scope.hasTrackingData = false
            } else {
              $scope.hasTrackingData = true
            }
          }
        },
      ],
    }
  },
])
