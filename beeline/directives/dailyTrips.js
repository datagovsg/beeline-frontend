export default function(LiteRoutesService, $timeout) {
  return {
    replace: true,
    restrict: 'E',
    template: '',
    scope: {
      'tripLabel': '<',
      'dailyTrips': '=',
    },
    link: function(scope, element, attributes) {
      var timeout;

      scope.pingLoopRunning = true;

      scope.$watch('tripLabel',(label)=>{
        if (!label) {
          scope.dailyTrips = [];
          return;
        }
        grabTrips(label);
      });

      scope.$on('$destroy', () => {
        $timeout.cancel(timeout);
        scope.pingLoopRunning = false;
      });

      function grabTrips(label) {
         LiteRoutesService.getLiteRoute(label, true)
         .then((response)=>{
           var route = response[scope.tripLabel];
           var runningTrips = route.trips.filter((trip)=>trip.isRunning);
           scope.dailyTrips = runningTrips[0] &&
               route.trips.filter(trip => trip.date == runningTrips[0].date);
         }).then(()=>{
           if (scope.pingLoopRunning) {
             timeout = $timeout(function () {
               grabTrips(label);
             }, new Date().setHours(24,1,0,0) - new Date().getTime());
           }
         }).catch((error)=>{
           console.log(error.stack);
           if (scope.pingLoopRunning) {
             timeout = $timeout(grabTrips(label), 1000*60);
           }
         })
      }
    },
 };
}
