import _ from "lodash"

export default [
  "$scope",
  "SharedVariableService",
  "$stateParams",
  "RoutesService",
  "TripService",
  "TicketService",
  "MapViewFactory",
  function(
    $scope,
    SharedVariableService,
    $stateParams,
    RoutesService,
    TripService,
    TicketService,
    MapViewFactory
  ) {
    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let ticketId = $stateParams.ticketId ? Number($stateParams.ticketId) : null

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    MapViewFactory.init($scope)

    const recentTimeBound = 2 * 60 * 60000
    const pingLoop = MapViewFactory.pingLoop($scope, recentTimeBound)
    const statusLoop = MapViewFactory.statusLoop($scope)
    MapViewFactory.setupPingLoops($scope, pingLoop, statusLoop)

    // ------------------------------------------------------------------------
    // Data Loading
    // ------------------------------------------------------------------------
    if (ticketId) {
      const ticketPromise = TicketService.getTicketById(ticketId)
      const tripPromise = ticketPromise.then(ticket => {
        return TripService.getTripData(Number(ticket.alightStop.tripId))
      })
      const routePromise = tripPromise.then(trip => {
        return RoutesService.getRoute(Number(trip.routeId))
      })
      ticketPromise.then(ticket => {
        $scope.mapObject.boardStop = ticket.boardStop
        $scope.mapObject.alightStop = ticket.alightStop
        SharedVariableService.setBoardStop(ticket.boardStop)
        SharedVariableService.setAlightStop(ticket.alightStop)
      })
      tripPromise.then(trip => {
        let stops = trip.tripStops.map(ts => {
          return _.assign(ts.stop, { canBoard: ts.canBoard })
        })
        $scope.mapObject.stops = stops
        SharedVariableService.setStops(stops)
      })
      routePromise.then(route => {
        if (route.path) {
          RoutesService.decodeRoutePath(route.path)
            .then(decodedPath => {
              $scope.mapObject.routePath = decodedPath
            })
            .catch(() => {
              $scope.mapObject.routePath = []
            })
        }
      })
    }
  },
]
