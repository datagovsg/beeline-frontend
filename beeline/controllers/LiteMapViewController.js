import { SafeInterval } from "../SafeInterval"
import _ from "lodash"

export default [
  "$scope",
  "SharedVariableService",
  "$stateParams",
  "RoutesService",
  "MapService",
  "TripService",
  "LiteRoutesService",
  "ServerTime",
  "MapViewFactory",
  function(
    $scope,
    SharedVariableService,
    $stateParams,
    RoutesService,
    MapService,
    TripService,
    LiteRoutesService,
    ServerTime,
    MapViewFactory
  ) {
    let routeLabel = $stateParams.label ? $stateParams.label : null
    // Date calculated as Date.now() + Local-Server-TimeDiff
    MapViewFactory.init($scope)

    LiteRoutesService.fetchLiteRoute(routeLabel).then(response => {
      const route = response[routeLabel]
      if (route.path) {
        RoutesService.decodeRoutePath(route.path)
          .then(decodedPath => {
            $scope.mapObject.routePath = decodedPath
          })
          .catch(() => {
            $scope.mapObject.routePath = []
          })
      }
      const trips = _.sortBy(route.trips, trip => {
        return trip.date
      })
      let nextTrips = trips.filter(trip => trip.date === trips[0].date)
      const liteTripStops = LiteRoutesService.computeLiteStops(nextTrips)
      $scope.mapObject.stops = liteTripStops
      SharedVariableService.setStops(liteTripStops)
    })

    MapService.once("ping-trips", trips => {
      $scope.mapObject.pingTrips = trips
    })

    // fetch driver pings every 4s
    $scope.timeout = new SafeInterval(pingLoop, 4000, 1000)

    MapService.once("killPingLoop", () => {
      $scope.timeout.stop()
    })

    MapService.once("startPingLoop", () => {
      $scope.timeout.start()
    })

    // load icons and path earlier by restart timeout on watching trips
    $scope.$watchCollection("mapObject.pingTrips", pt => {
      $scope.timeout.stop()

      if (pt) {
        $scope.timeout.start()
      }
    })

    async function pingLoop() {
      if (!$scope.mapObject.pingTrips) return
      $scope.mapObject.statusMessages = $scope.mapObject.statusMessages || []
      $scope.mapObject.allRecentPings = $scope.mapObject.allRecentPings || []

      $scope.mapObject.statusMessages.length = $scope.mapObject.allRecentPings.length =
        $scope.mapObject.pingTrips.length
      await Promise.all(
        $scope.mapObject.pingTrips.map((trip, index) => {
          return TripService.driverPings(trip.id).then(async info => {
            const now = ServerTime.getTime()
            $scope.mapObject.allRecentPings[index] = {
              ...info,
              isRecent:
                info.pings[0] && now - info.pings[0].time.getTime() < 5 * 60000,
            }

            $scope.mapObject.statusMessages[index] = _.get(
              info,
              "statuses[0].message",
              null
            )
          })
        })
      )
      // to mark no tracking data if no ping or pings are too old
      // isRecent could be undefined(no pings) or false (pings are out-dated)
      $scope.hasTrackingData = _.any(
        $scope.mapObject.allRecentPings,
        "isRecent"
      )
      let tripInfo = {
        hasTrackingData: $scope.hasTrackingData,
        statusMessages: $scope.mapObject.statusMessages.join(" "),
      }
      MapService.emit("tripInfo", tripInfo)
    }
  },
]
