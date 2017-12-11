import { SafeInterval } from "../SafeInterval"
import _ from "lodash"

export default [
  "$scope",
  "SharedVariableService",
  "$stateParams",
  "RoutesService",
  "MapService",
  "$timeout",
  "TripService",
  "TicketService",
  "ServerTime",
  "MapViewFactory",
  function(
    $scope,
    SharedVariableService,
    $stateParams,
    RoutesService,
    MapService,
    $timeout,
    TripService,
    TicketService,
    ServerTime,
    MapViewFactory
  ) {
    let ticketId = $stateParams.ticketId ? Number($stateParams.ticketId) : null
    // Date calculated as Date.now() + Local-Server-TimeDiff

    MapViewFactory.init($scope)

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

    MapService.once("ping-single-trip", trips => {
      $scope.mapObject.pingTrips = trips
    })

    // fetch driver pings every 4s
    $scope.timeout = new SafeInterval(pingLoop, 4000, 1000)
    $scope.statusTimeout = new SafeInterval(statusLoop, 60000, 1000)

    MapService.once("killTicketPingLoop", () => {
      $scope.timeout.stop()
      $scope.statusTimeout.stop()
    })

    MapService.once("startTicketPingLoop", () => {
      $scope.timeout.start()
      $scope.statusTimeout.start()
    })

    // load icons and path earlier by restart timeout on watching trips
    $scope.$watchCollection("mapObject.pingTrips", pt => {
      if (pt) {
        $scope.timeout.stop()
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
          return TripService.driverPings(trip.id).then(pings => {
            const [ping] = pings || []
            if (ping) {
              const now = ServerTime.getTime()
              $scope.mapObject.allRecentPings[index] = {
                pings,
                isRecent: now - ping.time.getTime() < 2 * 60 * 60000,
              }
              MapService.emit("ping", ping)
            }
          })
        })
      )
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

            if (status) {
              MapService.emit("status", status)
            }
          })
        })
      )
    }
  },
]
