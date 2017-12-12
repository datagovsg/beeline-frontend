import { formatTime, formatTimeArray } from "../shared/format"
import { SafeInterval } from "../SafeInterval"
import _ from "lodash"

angular.module("beeline").factory("MapViewFactory", [
  "MapService",
  function MapViewFactory(MapService) {
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
            return formatTimeArray(input)
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

        MapService.once("killPingLoop", () => {
          scope.timeout.stop()
          scope.statusTimeout.stop()
        })

        MapService.once("startPingLoop", () => {
          scope.timeout.start()
          scope.statusTimeout.start()
        })

        // load icons and path earlier by restart timeout on watching trips
        scope.$watchCollection("mapObject.pingTrips", pt => {
          if (pt) {
            scope.timeout.stop()
            scope.timeout.start()
          }
        })
      },
    }
  },
])
