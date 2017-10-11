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
  'LiteRoutesService',
  function($scope, SharedVariableService, $stateParams, BookingService,
    RoutesService, MapService, $timeout, TripService, LiteRoutesService) {

    let routeLabel = $stateParams.label ? $stateParams.label : null;

    $scope.mapObject = {
      stops: [],
      routePath: [],
      alightStop: null,
      boardStop: null,
      pingTrips: null,
      allRecentPings: [],
      chosenStop: null,
      statusMessages: [],
    }

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

    LiteRoutesService.fetchLiteRoute(routeLabel).then((response) => {
      var route = response[routeLabel]
      if (route.path) {
        RoutesService.decodeRoutePath(route.path)
          .then((decodedPath) => {
            $scope.mapObject.routePath = decodedPath
          })
          .catch(() => {
            $scope.mapObject.routePath = []
          })
      }
      var trips = _.sortBy(route.trips, (trip)=>{
        return trip.date
      })
      let nextTrips = trips.filter(
        trip=>trip.date === trips[0].date)
      var liteTripStops = LiteRoutesService.computeLiteStops(nextTrips)
      $scope.mapObject.stops = liteTripStops;
      SharedVariableService.setStops(liteTripStops)
    })


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
      $scope.timeout.stop();

      if (pt) {
        $scope.timeout.start();
      }
    });


    async function pingLoop() {
      if (!$scope.mapObject.pingTrips) return;

      $scope.mapObject.statusMessages = $scope.mapObject.statusMessages || []
      $scope.mapObject.allRecentPings = $scope.mapObject.allRecentPings || []

      $scope.mapObject.statusMessages.length = $scope.mapObject.allRecentPings.length = $scope.mapObject.pingTrips.length

      await Promise.all($scope.mapObject.pingTrips.map((trip, index) => {
        return TripService.DriverPings(trip.id)
        .then((info) => {
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
      let tripInfo = {
        'hasTrackingData': $scope.hasTrackingData,
        'statusMessages': $scope.mapObject.statusMessages.join(' ')
      }
      MapService.emit('tripInfo', tripInfo)
    }

  }
];
