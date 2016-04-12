import querystring from 'querystring';
import _ from 'lodash';

// Adapter function to convert what we get from the server into what we want
// Ideally shouldn't need this if the server stays up to date
// Transforms the data in place rather than making a new array
// This is to save time since its a deep copy and you wont need the original array anyway
function transformRouteData(data){
  _(data).each(function(route){
    var firstTripStops = route.trips[0].tripStops;
    route.startTime = firstTripStops[0].time;
    route.startRoad = firstTripStops[0].stop.description;
    route.endTime = firstTripStops[firstTripStops.length - 1].time;
    route.endRoad = firstTripStops[firstTripStops.length - 1].stop.description;
  });
  return data;
}

export default function($http, SERVER_URL, UserService) {
  return {

    getRoute: function (routeId) {
      return $http.get(SERVER_URL + `/routes/${routeId}?include_trips=true`)
        .then(function(response){ return response.data; })
        .then((route) => { // Convert date values to date object
          for (let trip of route.trips) {
            trip.date = new Date(trip.date);
            for (let tripStop of trip.tripStops) {
              tripStop.time = new Date(tripStop.time);
            }
          }
          return route;
        });
    },

    getRoutes: function(){
      return $http.get(SERVER_URL + '/routes?include_trips=true')
      .then(function(response){
        return transformRouteData(response.data);
      });
    },

    searchRoutes: function(startLat, startLng, endLat, endLng) {      
      return $http.get(SERVER_URL + '/routes/search_by_latlon?' + querystring.stringify({
        startLat: startLat,
        startLng: startLng,
        endLat: endLat,
        endLng: endLng,
        arrivalTime: '2016-02-26 01:00:00+00', //Doesn't do much right now so doesnt matter
        startTime: new Date().getTime(), //Start of search date
        endTime: new Date().getTime() + 30*24*60*60*1000 //End of search date
      }))
      .then(function(response) {
        return transformRouteData(response.data);
      });
    }

  };
}
