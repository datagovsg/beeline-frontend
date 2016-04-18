import qs from 'querystring';
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

    // Retrive the data on a single route
    // TODO refactor this to match getRoutes and searchRoutes
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

    // Retrive the data on all the routes
    getRoutes: function() {
      return $http.get(SERVER_URL + '/routes?include_trips=true')
      .then(function(response){
        return transformRouteData(response.data);
      });
    },

    searchRoutes: function(search) {
      //return Promise object
      return UserService.beeline({
        method: 'GET',
        url: '/routes/search_by_latlon?' + qs.stringify({
          startLat: search.startLat,
          startLng: search.startLng,
          endLat: search.endLat,
          endLng: search.endLng,
          arrivalTime: search.arrivalTime,
          startTime:  search.startTime,
          endTime: search.endTime
        }),
      }).then(function(response) {
        transformRouteData(response.data);
        return response.data;
      });
    },
    getRecentRoutes: function() {
      if (UserService.isLoggedIn()) {
        return UserService.beeline({
          method: 'GET',
          url: '/routes/recent?limit=10'
        }).then(function(response) {
          return response.data;
        });
      } else {
        return Promise.resolve([]);
      }
    },

  };
}
