import { formatTime, formatTimeArray } from "../shared/format"
import _ from "lodash"

angular.module("beeline").factory("MapViewFactory", () => {
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
  }
})
