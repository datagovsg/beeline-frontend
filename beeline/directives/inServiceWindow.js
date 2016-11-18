import {SafeInterval} from '../SafeInterval';
import _ from 'lodash';

export default function ($timeout) {
  return {
    replace: true,
    restrict: 'E',
    template: '',
    scope: {
      'availableTrips' : '<',
      'inServiceWindow': '=?',
    },
    link: function(scope, element, attributes) {
      var allStopsTime;
      scope.timeout = new SafeInterval(()=>checkServiceWindow(scope.availableTrips), 1000*8, 1000);
      scope.timeout.start();
      scope.$on('$destroy', () => {
        if (scope.timeout) scope.timeout.stop();
      });
      function checkServiceWindow(trips) {
        var checkPromise = new Promise(function(resolve) {
          var allStopsTime = _.flatten(trips.map(trip=>trip.tripStops))
                            .map(stop=>stop.time).sort();
          if (allStopsTime) {
            scope.startTime = allStopsTime[0];
            scope.endTime = allStopsTime[allStopsTime.length-1];
            console.log("inServiceWindow");
            console.log(scope.startTime);
            console.log(scope.endTime);
          }
          resolve();
        });
        return checkPromise;
      }
    }
  }
}
