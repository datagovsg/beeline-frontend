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
    MapViewFactory.init($scope)

    let routeLabel = $stateParams.label ? $stateParams.label : null
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

    MapViewFactory.setupPingLoops($scope, pingLoop, statusLoop)

    /**
     * Request driver pings for the given trip
     */
    async function pingLoop() {
      const recentTimeBound = 5 * 60000
      await MapViewFactory.pingLoop($scope, recentTimeBound)()

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

    const statusLoop = MapViewFactory.statusLoop($scope)
  },
]
