import _ from 'lodash';

/* Update a scope so that the child scopes also
receive the $ionicView.*Enter events */
export function setupBroadcastViewEnter($scope) {
  $scope.$on('$ionicView.afterEnter', function(a, b) {
        // var next = $scope.$$childHead;
        // while (next) {
        //     next.$broadcast('$ionicView.afterEnter', a, b);
        //     next = next.$$nextSibling;
        // }
    $scope.$broadcast('mapRequireResize');
  });
}

var lineSymbol = {
  path: 'M 0,-1 0,1',
  strokeOpacity: 1,
  scale: 4
};
var lineIcons = {
  path: [{lat: 22.291, lng: 153.027}, {lat: 18.291, lng: 153.027}],
  strokeOpacity: 0,
  icons: [{
    icon: lineSymbol,
    offset: '0',
    repeat: '20px'
  }],
};
export function dashedLineIcons() {
  return lineIcons;
}

export function defaultMapOptions(options) {
  return _.assign({
    center: {latitude: 1.370244, longitude: 103.823315},
    zoom: 11,
    bounds: { // so that autocomplete will mainly search within Singapore
        northeast: {
            latitude: 1.485152,
            longitude: 104.091837
          },
        southwest: {
            latitude: 1.205764,
            longitude: 103.589899
          }
      },
    control: {},
    options: {
        disableDefaultUI: true,
        styles: [{
            featureType: "poi",
            stylers: [{
                visibility: "off"
              }]
          }],
        draggable: true
      },
    markers: [],
    lines: [],
  }, options || {});
}

export function retriveNextTrip(route) {
  //compare current date with nearest date trip's 1st board stop time
  var sortedRunningTripInDates = _.sortBy(route.trips.filter(tr => tr.isRunning),'date');
  var now = Date.now();
  var nextTrip = null;
  for (let trip of sortedRunningTripInDates) {
    var sortedTripStopsInTime = _.sortBy(trip.tripStops,'time');
    var boardTime = null, lastStopTime = null;
    if (trip.bookingInfo.windowSize && trip.bookingInfo.windowType) {
      if (trip.bookingInfo.windowType === 'firstStop') {
        boardTime = sortedTripStopsInTime[0].time.getTime() + trip.bookingInfo.windowSize;
      }
      //FIXME : windowType == "stop"
    }
    //if no booking window information
    if (boardTime == null) {
      boardTime = sortedTripStopsInTime[0].time.getTime();
    }
    //the trip end time
    lastStopTime = sortedTripStopsInTime[sortedTripStopsInTime.length-1].time.getTime();
    //check seat is available
    if (now < boardTime || (now >= boardTime && now <= lastStopTime)) {
      nextTrip = trip;
      break;
    }
  }
  return nextTrip;
}
