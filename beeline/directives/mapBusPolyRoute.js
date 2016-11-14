export default function(TripService, uiGmapGoogleMapApi, $timeout, SafeInterval) {
  return {
    replace: false,
    template: `
    <ui-gmap-polyline ng-repeat ="actualPath in map.lines.actualPaths"
                      ng-if="actualPath.path.length"
                      path="actualPath.path"
                      stroke="strokeOptions"></ui-gmap-polyline>
    <ui-gmap-marker ng-repeat="busLocation in map.busLocations"
                    ng-if="busLocation.coordinates"
                    idkey="'bus-location{{index}}'"
                    coords="busLocation.coordinates"
                    icon="busLocation.icon"></ui-gmap-marker>
    `,
    scope: {
      route: '<',
      availableTrips: '<',
    },
    link: function(scope, element, attributes) {

      scope.strokeOptions = {
        color: '#4b3863',
        weight: 3.0,
        opacity: 0.7
      };

      scope.map = {
        lines: {
          actualPaths: [
            { path: [] }
          ],
        },
        busLocations: [
          { coordinates: null,
            icon: null,}
        ]
      }

      scope.recentPings = [];
      scope.timeout;

      scope.$watch('route', (route) => {
        if (!route) return;
        pingLoop();
      });

      scope.$watch('availableTrips', (availableTrips) => {
        if (!availableTrips) return;

        uiGmapGoogleMapApi.then((googleMaps) => {
          var icon = {
            url: 'img/busMarker.svg',
            scaledSize: new googleMaps.Size(68, 86),
            anchor: new googleMaps.Point(34, 78),
          };
          scope.availableTrips.map((trip, index)=>{
            scope.map.busLocations[index] = {
              icon: icon
            }
          })
        })
      })

      scope.$watchCollection('recentPings', function(recentPings) {
        if (recentPings) {
          recentPings.map((pings, index)=>{
            if (pings.length > 0){

              var coordinates = pings[0].coordinates;
              var path = pings.map(ping => ({
                latitude: ping.coordinates.coordinates[1],
                longitude: ping.coordinates.coordinates[0]
              }));
              scope.map.busLocations[index].coordinates = coordinates;

              scope.map.lines.actualPaths[index] = {
                path: path
              }
            }else {
              //to remove bus icon and actual path
              scope.map.busLocations[index].coordinates = null;
              scope.map.lines.actualPaths[index] = {
                path: null
              }
            }
          })
        }
      });

      scope.$on("killPingLoop", () => {
        scope.timeout.pause();
      });

      scope.$on("startPingLoop", () => {
        if (!scope.route && scope.timeout) return;
        scope.timeout = new SafeInterval(pingLoop, 8000);
      });

      function pingLoop() {
        console.log("PING LOOP");
        return Promise.all(scope.availableTrips.map((trip, index)=>{
          return TripService.DriverPings(trip.id)
          .then((info) => {
            /* Only show pings from the last 5 minutes */
            // max 12 pings
            var now = Date.now();
            return scope.recentPings[index] = _.filter(info.pings,
              ping => now - ping.time.getTime() < 5*60*1000)
              .slice(0,13);
          })
        }))
        .catch((error)=>{
          scope.timeout.pause();
          scope.timeout =  new SafeInterval(pingLoop, 1000);
        }) // catch all errors
      }

    },
  };
}
