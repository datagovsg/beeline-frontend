import { formatTime, formatTimeArray } from "../shared/format"
import _ from "lodash"

export default [
  "$scope",
  "SharedVariableService",
  "$stateParams",
  "BookingService",
  "RoutesService",
  "MapService",
  function(
    $scope,
    SharedVariableService,
    $stateParams,
    BookingService,
    RoutesService,
    MapService
  ) {
    let routeId = $stateParams.routeId ? Number($stateParams.routeId) : null

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

    MapService.on("board-stop-selected", stop => {
      $scope.mapObject.boardStop = stop
      SharedVariableService.setBoardStop(stop)
    })

    MapService.on("alight-stop-selected", stop => {
      $scope.mapObject.alightStop = stop
      SharedVariableService.setAlightStop(stop)
    })

    MapService.on("stop-selected", stop => {
      $scope.mapObject.chosenStop = stop
      SharedVariableService.setChosenStop(stop)
    })

    if (routeId) {
      RoutesService.getRoute(routeId).then(response => {
        const route = response
        // Grab the stop data
        let [pickups, dropoffs] = BookingService.computeStops(route.trips)
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
  },
]
