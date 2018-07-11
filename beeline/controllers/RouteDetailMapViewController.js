import _ from 'lodash'

export default [
  '$scope',
  'SharedVariableService',
  '$stateParams',
  'BookingService',
  'RoutesService',
  'MapService',
  'MapViewFactory',
  'TicketService',
  'TripService',
  function (
    $scope,
    SharedVariableService,
    $stateParams,
    BookingService,
    RoutesService,
    MapService,
    MapViewFactory,
    TicketService,
    TripService
  ) {
    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let routeId = $stateParams.routeId ? Number($stateParams.routeId) : null

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    MapViewFactory.init($scope)

    // ------------------------------------------------------------------------
    // Data Loading
    // ------------------------------------------------------------------------
    if (routeId) {
      RoutesService.getRoute(routeId).then(response => {
        const route = response
        // Grab the stop data
        let [pickups, dropoffs] = BookingService.getStopsFromTrips(route.trips)
        const stops = pickups.concat(dropoffs)
        SharedVariableService.setStops(stops)
        $scope.mapObject.stops = stops
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

    // ------------------------------------------------------------------------
    // Ionic Events
    // ------------------------------------------------------------------------
    $scope.$on('$destroy', () => {
      MapService.removeListener('ticketIdIsAvailable', listener)
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    MapService.once('ticketIdIsAvailable', listener)

    MapService.on('board-stop-selected', stop => {
      $scope.mapObject.boardStop = stop
      SharedVariableService.setBoardStop(stop)
    })

    MapService.on('alight-stop-selected', stop => {
      $scope.mapObject.alightStop = stop
      SharedVariableService.setAlightStop(stop)
    })

    MapService.on('stop-selected', stop => {
      $scope.mapObject.chosenStop = stop
      SharedVariableService.setChosenStop(stop)
    })

    // ------------------------------------------------------------------------
    // Helper functions
    // ------------------------------------------------------------------------
    // show pings in route-detail map
    function listener (ticketId) {
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
        const recentTimeBound = 2 * 60 * 60000
        const pingLoop = MapViewFactory.pingLoop($scope, recentTimeBound)
        const statusLoop = MapViewFactory.statusLoop($scope)
        MapViewFactory.setupPingLoops($scope, pingLoop, statusLoop)
      }
    }
  },
]
