import { formatTime, formatTimeArray } from "../shared/format"
import _ from "lodash"

export default [
  function MapViewFactory() {
    return {
      initMapObject: function($scope) {
        const originalMapObject = {
          stops: [],
          routePath: [],
          alightStop: null,
          boardStop: null,
          pingTrips: [],
          allRecentPings: [],
          chosenStop: null,
          statusMessages: [],
        }

        $scope.mapObject = _.assign({}, originalMapObject)
      },
      init: function($scope) {
        this.initMapObject($scope)

        $scope.disp = {
          popupStop: null,
          routeMessage: null,
        }

        $scope.closeWindow = function() {
          $scope.disp.popupStop = null
        }

        $scope.applyTapBoard = function(stop) {
          $scope.disp.popupStop = stop
          $scope.$digest()
        }

        $scope.formatStopTime = function(input) {
          if (Array.isArray(input)) {
            return formatTimeArray(input)
          }
          return formatTime(input)
        }
      },
    }
  },
]
