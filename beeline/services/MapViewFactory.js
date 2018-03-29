import { formatTime } from "../shared/format"
import { SafeInterval } from "../SafeInterval"
import _ from "lodash"

angular.module("beeline").factory("MapViewFactory", [
  "MapService",
  "TripService",
  "ServerTime",
  function MapViewFactory(MapService, TripService, ServerTime) {
    return {
      init: function(scope) {
        scope.mapObject = this.mapObject()

        scope.disp = this.disp()

        scope.closeWindow = function() {
          scope.disp.popupStop = null
        }

        scope.applyTapBoard = function(stop) {
          scope.disp.popupStop = stop
          scope.$digest()
        }

        scope.formatStopTime = function(input) {
          if (Array.isArray(input)) {
            return ""
          }
          return formatTime(input)
        }
      },
      mapObject: function() {
        return _.assign(
          {},
          {
            stops: [],
            routePath: [],
            alightStop: null,
            boardStop: null,
            pingTrips: [],
            allRecentPings: [],
            chosenStop: null,
            statusMessages: [],
          }
        )
      },
      disp: function() {
        return {
          popupStop: null,
          routeMessage: null,
        }
      },
      setupPingLoops: function(scope, pingLoop, statusLoop) {
        // fetch driver pings every 4s and statuses every 60s
        scope.timeout = new SafeInterval(pingLoop, 4000, 1000)
        scope.statusTimeout = new SafeInterval(statusLoop, 60000, 1000)

        MapService.once("ping-trips", trips => {
          scope.mapObject.pingTrips = trips
        })

        MapService.once("startPingLoop", () => {
          scope.timeout.start()
          scope.statusTimeout.start()
          // register this once startPingLoop is fired so to avoid race condition
          // ("killPingLoop is fired before startPingLoop")
          MapService.once("killPingLoop", () => {
            scope.timeout.stop()
            scope.statusTimeout.stop()
          })
        })

        // load icons and path earlier by restart timeout on watching trips
        scope.$watchCollection("mapObject.pingTrips", pt => {
          if (pt) {
            scope.timeout.stop()
            scope.timeout.start()
          }
        })
      },
      pingLoop: function(scope, recentTimeBound) {
        return async function() {
          if (!scope.mapObject.pingTrips) return

          // if scope.mapObject.allRecentPings doesn't exist yet, initialize
          // it as a new empty array. The array will be filled in in the
          // subsequent chunk of code mapping over pingTrips
          scope.mapObject.allRecentPings =
            scope.mapObject.allRecentPings ||
            new Array(scope.mapObject.pingTrips.length)

          await Promise.all(
            scope.mapObject.pingTrips.map((trip, index) => {
              return TripService.driverPings(trip.id).then(pings => {
                const [ping] = pings || []
                if (ping) {
                  const now = ServerTime.getTime()
                  scope.mapObject.allRecentPings[index] = {
                    pings,
                    isRecent: now - ping.time.getTime() < recentTimeBound,
                  }
                  MapService.emit("ping", ping)
                }
              })
            })
          )
        }
      },
      statusLoop: function(scope) {
        return async function() {
          if (!scope.mapObject.pingTrips) return

          // if scope.mapObject.statusMessages doesn't exist yet, initialize
          // it as a new empty array. The array will be filled in in the
          // subsequent chunk of code mapping over pingTrips
          scope.mapObject.statusMessages =
            scope.mapObject.statusMessages ||
            new Array(scope.mapObject.pingTrips.length)

          await Promise.all(
            scope.mapObject.pingTrips.map((trip, index) => {
              return TripService.statuses(trip.id).then(statuses => {
                const status = _.get(statuses, "[0]", null)
                scope.mapObject.statusMessages[index] = _.get(
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
    }
  },
])
