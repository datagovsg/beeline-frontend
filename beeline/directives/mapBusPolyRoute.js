export default function(TripService) {
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
      tripId: '<',
    },
    link: function(scope, element, attributes) {
      scope.strokeOptions = {
        color: '#4b3863',
        weight: 3.0,
        opacity: 0.7
      };
      scope.recentPings = [];

      scope.$watch('tripId', (tripId) => {
        if (!tripId) return;

        getPings(tripId).then((pings) => {
          scope.path = ...
          scope.busLocation = ...
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
              $scope.map.busLocations[index].coordinates = coordinates;
              $scope.map.lines.actualPaths.splice(index,0, {
                "path": path
              })
            }
          })
        }
      });

      function pingLoop() {
         console.log("Ping again!");
         Promise.all($scope.todayTrips.map((trip, index)=>{
           console.log("currently is pinging "+trip.id);
          return TripService.DriverPings(trip.id)
          .then((info) => {
            /* Only show pings from the last two hours */
            var now = Date.now();
            return $scope.recentPings[index] = _.filter(info.pings,
              ping => now - ping.time.getTime() < 2*60*60*1000);
          })
        }))
        .then(() => {
          pingTimer = $timeout(pingLoop, 15000);
        }); // catch all errors
      }

      function

    },
  };
}
