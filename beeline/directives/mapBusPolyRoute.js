export default function(TripService, uiGmapGoogleMapApi, $timeout) {
  return {
    replace: false,
    template: `
    <ui-gmap-polyline ng-repeat ="actualPath in map.lines.actualPaths"
                      ng-if="actualPath.path.length"
                      path="actualPath.path"
                      stroke="map.pathOptions.actualPath"></ui-gmap-polyline>
    <ui-gmap-marker ng-repeat="busLocation in map.busLocations"
                    ng-if="busLocation.coordinates"
                    idkey="'bus-location{{index}}'"
                    coords="busLocation.coordinates"
                    icon="busLocation.icon"></ui-gmap-marker>
    `,
    scope: {
      route: '<',
      todayTrips: '<',
    },
    link: function(scope, element, attributes) {

      var pingTimer;

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

      scope.$watch('route', (route) => {
        if (!route || pingTimer) return;
        pingLoop();
      });

      scope.$watch('todayTrips', (todayTrips) => {
        if (!todayTrips) return;

        console.log("today!!!!!!", todayTrips)

        uiGmapGoogleMapApi.then((googleMaps) => {
          var icon = {
            url: 'img/busMarker.svg',
            scaledSize: new googleMaps.Size(68, 86),
            anchor: new googleMaps.Point(34, 78),
          };
          scope.todayTrips.map((trip, index)=>{
            scope.map.busLocations.splice(index,0, {
              "icon": icon
            })
          })
        })
      })

      scope.$watchCollection('recentPings', function(recentPings) {
        console.log("recent pings are here ");
        console.log(recentPings);
        if (recentPings) {
          recentPings.map((pings, index)=>{
            if (pings.length > 0){

              var coordinates = pings[0].coordinates;
              var path = pings.map(ping => ({
                latitude: ping.coordinates.coordinates[1],
                longitude: ping.coordinates.coordinates[0]
              }));
              scope.map.busLocations[index].coordinates = coordinates;
              scope.map.lines.actualPaths.splice(index,0, {
                "path": path
              })
            }
          })
        }
      });

      scope.$on("killPingLoop", () => {
        console.log("cancelling!")
        $timeout.cancel(pingTimer);
      });

      scope.$on("startPingLoop", () => {
        if (!scope.route) return;
        pingLoop();
      });

      function pingLoop() {
         console.log("Ping again!");
         Promise.all(scope.todayTrips.map((trip, index)=>{
           console.log("currently is pinging "+trip.id);
          return TripService.DriverPings(trip.id)
          .then((info) => {
            /* Only show pings from the last two hours */
            var now = Date.now();
            return scope.recentPings[index] = _.filter(info.pings,
              ping => now - ping.time.getTime() < 2*60*60*1000);
          })
        }))
        .then(() => {
          pingTimer = $timeout(pingLoop, 15000);
        }); // catch all errors
      }

    },
  };
}
