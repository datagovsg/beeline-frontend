import {SafeInterval} from '../SafeInterval';
const leftPad = require('left-pad');

export default function(TripService, uiGmapGoogleMapApi, $timeout) {
  return {
    replace: false,
    restrict: 'E',
    template: `
    <ui-gmap-marker ng-repeat="busLocation in map.busLocations"
                    ng-if="busLocation.coordinates"
                    idkey="'bus-location{{index}}'"
                    coords="busLocation.coordinates"
                    icon="busLocation.icon"></ui-gmap-marker>
    `,
    scope: {
      availableTrips: '<',
      hasTrackingData: '=?',
      routeMessage: '=?',
    },
    link: function(scope, element, attributes) {

      // scope.strokeOptions = {
      //   color: '#4b3863',
      //   weight: 3.0,
      //   opacity: 0.7
      // };
      //
      // scope.strokeIcons = [{
      //     icon: {
      //       path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
      //     },
      //     offset: '10px',
      //     repeat: '100px'
      // }];

      scope.map = {
        // lines: {
        //   actualPaths: [
        //     { path: [] }
        //   ],
        // },
        busLocations: [
          { coordinates: null,
            icon: null,}
        ]
      }

      scope.recentPings = null;

      scope.statusMessages = [];

      scope.$watch('availableTrips', (availableTrips) => {
        if (!availableTrips) return;

        uiGmapGoogleMapApi.then((googleMaps) => {
          scope.availableTrips.map((trip, index)=>{
            scope.map.busLocations[index] = {
              icon: {
                url: `img/busMarker_${leftPad((index % 10) + 1, 2, '0')}.svg`,
                scaledSize: new googleMaps.Size(68, 86),
                anchor: new googleMaps.Point(34, 78),
              }
            }
          })
        })
      })

      scope.$watchCollection('statusMessages', ()=>{
        scope.routeMessage = scope.statusMessages.join(' ');
      })

      scope.$watchCollection('recentPings', function(recentPings) {
        if (recentPings) {
          scope.hasTrackingData = _.some(recentPings, rp => rp && rp.length);
          if (!scope.hasTrackingData) {
            //to remove path and bus icon
            // _.forEach(scope.map.lines.actualPaths,(actualPath)=>{
            //   actualPath = {
            //     path: null
            //   };
            // });
            _.forEach(scope.map.busLocations, (busLocation)=>{
              busLocation.coordinates = null;
            });
            return;
          }

          recentPings.forEach((pings, index)=>{
            if (pings.length > 0){

              var coordinates = pings[0].coordinates;
              // var path = pings.map(ping => ({
              //   latitude: ping.coordinates.coordinates[1],
              //   longitude: ping.coordinates.coordinates[0]
              // }));
              scope.map.busLocations[index].coordinates = coordinates;
              //
              // scope.map.lines.actualPaths[index] = {
              //   path: path
              // }
            } else {
              //to remove bus icon and actual path
              scope.map.busLocations[index].coordinates = null;
              // scope.map.lines.actualPaths[index] = {
              //   path: null
              // }
            }
          })
        } else {
          scope.hasTrackingData = null;
        }
      });

      scope.timeout = new SafeInterval(pingLoop, 8000, 1000);

      scope.$on("killPingLoop", () => {
        scope.timeout.stop();
      });

      scope.$on("startPingLoop", () => {
        scope.timeout.start();
      });

      //load icons and path earlier by restart timeout on watching trips
      var availableTripsPromise = new Promise((resolve) => {
        scope.$watchCollection("availableTrips", ()=>{
          if (scope.availableTrips) {
            resolve();
          }
          scope.timeout.stop();
          scope.timeout.start();
        })
      });

      async function pingLoop() {
        await availableTripsPromise;

        await Promise.all(scope.availableTrips.map((trip, index) => {
          return TripService.DriverPings(trip.id)
          .then((info) => {
            //get status msg
            scope.statusMessages[index] = _.get(info, 'statuses[0].message', null);
            scope.recentPings = scope.recentPings || [];

            /* Only show pings from the last 5 minutes */
            // max 12 pings
            var now = Date.now();
            return scope.recentPings[index] = _.filter(info.pings,
              ping => now - ping.time.getTime() < 5*60*1000)
              .slice(0,13);
          })
        }))
      }
    },
  };
}
