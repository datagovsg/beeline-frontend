import {SafeInterval} from '../SafeInterval';
import _ from 'lodash';

export default ['$timeout',
  function ($timeout) {
    return {
      replace: true,
      restrict: 'E',
      template: '',
      scope: {
        'availableTrips' : '<',
        'inServiceWindow': '=',
      },
      link: function(scope, element, attributes) {
        var allStopsTime;
        scope.inServiceWindow = null;
        //check in service window every 1 min, if fails re-try in 1 sec
        scope.timeout = new SafeInterval(()=>checkServiceWindow(scope.availableTrips), 1000*60, 1000);
        scope.timeout.start();
        scope.$on('$destroy', () => {
          if (scope.timeout) scope.timeout.stop();
        });
        //to restart the loop when available trips become not null
        scope.$watchCollection('availableTrips', ()=>{
          scope.timeout.stop();
          scope.timeout.start();
        })
        function checkServiceWindow(trips) {
          if (!trips || trips.length == 0) {
            scope.inServiceWindow = null;
          } else {
            var allStopsTime = _.flatten(trips.map(trip=>trip.tripStops))
                              .map(stop=>stop.time).sort();
            if (allStopsTime) {
              //15 min before 1st stop time
              scope.startTime = new Date(allStopsTime[0]).getTime() - 1000*60*15;
              scope.endTime = new Date(allStopsTime[allStopsTime.length-1]).getTime();
              scope.now = Date.now();
              if (isFinite(scope.startTime) && isFinite(scope.endTime)) {
                scope.inServiceWindow = scope.startTime <= scope.now && scope.now <= scope.endTime;
              } else {
                scope.inServiceWindow = false;
              }
            }
          }
          return Promise.resolve();
        }
      }
    }
}]
