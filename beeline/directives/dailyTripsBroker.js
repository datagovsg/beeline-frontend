import {SafeScheduler} from '../SafeScheduler';
// since it's broker, we allow 2-way binding for now and
// view update the data model which controll relies on
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

      scope.dailyTrips = [];

      scope.$watch('tripLabel', (label) => {
        if (timeout) timeout.stop();

        if (!label) {
          return;
        }

        timeout = new SafeScheduler(() => grabTrips(label), 24, 1, 0);

        timeout.start();
      });

      scope.$on('$destroy', () => {
        if (timeout) timeout.stop();
      });

      function grabTrips(label) {
        return LiteRoutesService.getLiteRoute(label, true)
          .then((response)=>{
            var route = response[scope.tripLabel];
            var runningTrips = route.trips.filter((trip)=>trip.isRunning);
            scope.dailyTrips = runningTrips[0] &&
               route.trips.filter(trip => trip.date == runningTrips[0].date);
          })
      }
    },
 };
}
