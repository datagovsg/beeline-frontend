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

    // fetch driver pings every 4s and statuses every 60s
    $scope.timeout = new SafeInterval(pingLoop, 4000, 1000)
    $scope.statusTimeout = new SafeInterval(statusLoop, 60000, 1000)

    MapService.once("killPingLoop", () => {
      $scope.timeout.stop()
      $scope.statusTimeout.stop()
    })

    MapService.once("startPingLoop", () => {
      $scope.timeout.start()
      $scope.statusTimeout.start()
    })

    // load icons and path earlier by restart timeout on watching trips
    $scope.$watchCollection("mapObject.pingTrips", pt => {
      $scope.timeout.stop()

      if (pt) {
        $scope.timeout.start()
      }
    })

    /**
     * Request driver pings for the given trip
     */
    async function pingLoop() {
      if (!$scope.mapObject.pingTrips) return

      $scope.mapObject.allRecentPings = $scope.mapObject.allRecentPings || []
      $scope.mapObject.allRecentPings.length = $scope.mapObject.pingTrips.length

      await Promise.all(
        $scope.mapObject.pingTrips.map((trip, index) => {
          return TripService.driverPings(trip.id).then(async pings => {
            const now = ServerTime.getTime()
            $scope.mapObject.allRecentPings[index] = {
              pings,
              isRecent: pings[0] && now - pings[0].time.getTime() < 5 * 60000,
            }
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

    /**
     * Request status messages for the given trip
     */
    async function statusLoop() {
      if (!$scope.mapObject.pingTrips) return

      $scope.mapObject.statusMessages = $scope.mapObject.statusMessages || []
      $scope.mapObject.statusMessages.length = $scope.mapObject.pingTrips.length

      await Promise.all(
        $scope.mapObject.pingTrips.map((trip, index) => {
          return TripService.statuses(trip.id).then(statuses => {
            const status = _.get(statuses, "[0]", null)

            $scope.mapObject.statusMessages[index] = _.get(
              status,
              "message",
              null
            )
          })
        })
      )
    }
  },
]
