import {SafeInterval} from '../SafeInterval';
import {formatTime, formatTimeArray} from '../shared/format';
export default [
  '$scope',
  'SharedVariableService',
  '$stateParams',
  'BookingService',
  'RoutesService',
  'MapService',
  '$timeout',
  'TripService',
  'TicketService',
  function($scope, SharedVariableService, $stateParams, BookingService,
    RoutesService, MapService, $timeout, TripService, TicketService) {
      let routeId = $stateParams.routeId ? +$stateParams.routeId : null;
      let pickupStopId = $stateParams.pickupStopId
                           ? +$stateParams.pickupStopId
                           : null;
      let dropoffStopId = $stateParams.dropoffStopId
                            ? +$stateParams.dropoffStopId
                            : null;
      let ticketId = $stateParams.ticketId ? +$stateParams.ticketId : null;

    var originalMapObject = {
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

    $scope.closeWindow = function () {
      $scope.disp.popupStop = null;
    }

    $scope.applyTapBoard = function (stop) {
      $scope.disp.popupStop = stop;
      $scope.$digest()
    }

    $scope.formatStopTime = function (input) {
      if(Array.isArray(input)) {
        return formatTimeArray(input)
      } else {
        return formatTime(input)
      }
    }

    MapService.on('board-stop-selected', (stop) => {
      $scope.mapObject.boardStop = stop
      SharedVariableService.setBoardStop(stop)
    })

    MapService.on('alight-stop-selected', (stop) => {
      $scope.mapObject.alightStop = stop
      SharedVariableService.setAlightStop(stop)
    })

    MapService.on('stop-selected', (stop) => {
      $scope.mapObject.chosenStop = stop
      SharedVariableService.setChosenStop(stop)
    })

    if (routeId) {
      RoutesService.getRoute(routeId).then((response) => {
        var route = response
        // Grab the stop data
        let [pickups, dropoffs] = BookingService.computeStops(route.trips);
        var stops = pickups.concat(dropoffs);
        SharedVariableService.setStops(stops)
        $scope.mapObject.stops = stops
        if (route.path) {
          RoutesService.decodeRoutePath(route.path)
            .then((decodedPath) => {
              $scope.mapObject.routePath = decodedPath
            })
            .catch(() => {
              $scope.mapObject.routePath = []
            })
        }
      })
    }

    if (ticketId) {
      var ticketPromise = TicketService.getTicketById(ticketId);
      var tripPromise = ticketPromise.then((ticket) => {
        return TripService.getTripData(+ticket.alightStop.tripId);
      });
      var routePromise = tripPromise.then((trip) => {
        return RoutesService.getRoute(+trip.routeId);
      });
      ticketPromise.then((ticket) => {
        $scope.mapObject.boardStop = ticket.boardStop
        $scope.mapObject.alightStop = ticket.alightStop
        SharedVariableService.setBoardStop(ticket.boardStop)
        SharedVariableService.setAlightStop(ticket.alightStop)
      });
      tripPromise.then((trip) => {
        let stops = trip.tripStops.map((ts) => {
          return _.assign(ts.stop, {canBoard: ts.canBoard})
        })
        $scope.mapObject.stops = stops
        SharedVariableService.setStops(stops)
      })
      routePromise.then((route) => {
        if (route.path) {
          RoutesService.decodeRoutePath(route.path)
            .then((decodedPath) => {
              $scope.mapObject.routePath = decodedPath
            })
            .catch(() => {
              $scope.mapObject.routePath = []
            })
        }
      })
    }

    MapService.on('ping-trips', (trips) => {
      $scope.mapObject.pingTrips = trips
    })

    //fetch driver pings every 4s
    $scope.timeout = new SafeInterval(pingLoop, 4000, 1000);

    MapService.on("killPingLoop", () => {
      $scope.timeout.stop();
    });

    MapService.on("startPingLoop", () => {
      $scope.timeout.start();
    });

    //load icons and path earlier by restart timeout on watching trips
    $scope.$watchCollection('mapObject.pingTrips', (pt) => {
      if (pt) {
        $scope.timeout.stop();
        $scope.timeout.start();
      }
    });

    $scope.$watchCollection('mapObject.statusMessages', () => {
      $scope.disp.routeMessage = $scope.mapObject.statusMessages.join(' ').concat('HELLO');
    })

    async function pingLoop() {
      if (!$scope.mapObject.pingTrips) return;

      $scope.mapObject.statusMessages = $scope.mapObject.statusMessages || []
      $scope.mapObject.allRecentPings = $scope.mapObject.allRecentPings || []

      $scope.mapObject.statusMessages.length = $scope.mapObject.allRecentPings.length = $scope.mapObject.pingTrips.length

      await Promise.all($scope.mapObject.pingTrips.map((trip, index) => {
        return TripService.DriverPings(trip.id)
        .then((info) => {
          var tripInfo = {
            'tripCode': info && info.code,
            'vehicle': info && info.trip && info.trip.vehicle && info.trip.vehicle.vehicleNumber,
            'driver': info && info.trip && info.trip.tripDriver && info.trip.tripDriver.name,
            'tripStatus': info && info.trip && info.trip.status
          }
          MapService.emit('tripInfo', tripInfo)
          const now = Date.now()

          $scope.mapObject.allRecentPings[index] = {
            ...info,
            isRecent: info.pings[0] &&
              (now - info.pings[0].time.getTime()) < 5 * 60000,
          }

          $scope.mapObject.statusMessages[index] = _.get(info, 'statuses[0].message', null)
        })
      }))
      //to mark no tracking data if no ping or pings are too old
      if (_.every($scope.mapObject.allRecentPings,{"isRecent": undefined})) {
        $scope.hasTrackingData = false;
      } else {
        $scope.hasTrackingData = true;
      }
    }
  }
];
