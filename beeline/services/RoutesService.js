import qs from 'querystring';
import _ from 'lodash';
import assert from 'assert';

// Adapter function to convert what we get from the server into what we want
// Ideally shouldn't need this if the server stays up to date
// Transforms the data in place rather than making a new array
// This is to save time since its a deep copy and you wont need the original array anyway
function transformRouteData(data){
  _(data).each(function(route){
    for (let trip of route.trips) {
      assert(typeof trip.date == 'string');
      trip.date = new Date(trip.date);

      for (let tripStop of trip.tripStops) {
        assert(typeof tripStop.time == 'string');
        tripStop.time = new Date(tripStop.time);
      }
    }

    var firstTripStops = route.trips[0].tripStops;
    route.startTime = firstTripStops[0].time;
    route.startRoad = firstTripStops[0].stop.description;
    route.endTime = firstTripStops[firstTripStops.length - 1].time;
    route.endRoad = firstTripStops[firstTripStops.length - 1].stop.description;
    // route.trips = _.sortBy(route.trips, trip => trip.date);
    // route.tripsByDate = [];
    route.tripsByDate =_.keyBy(route.trips,
        trip => trip.date.getTime());
  });
  return data;
}

export default function($http, SERVER_URL, UserService) {

  var routesCachePromise;
  var routesById;

  return {

    // Retrive the data on a single route
    // TODO refactor this to match getRoutes and searchRoutes
    getRoute: function (routeId) {
      return this.getRoutes()
      .then(() => {
        assert(routesById);
        return routesById[routeId];
      })
    },

    // Retrive the data on all the routes
    getRoutes: function() {
      if (routesCachePromise) {
        return routesCachePromise;
      }
      else {
        routesCachePromise = UserService.beeline({
          method: 'GET',
          url: '/routes?include_trips=true'
        })
      .then(function(response){
          routesById = _.keyBy(response.data, route => route.id);

        return transformRouteData(response.data);
        })

        return routesCachePromise;
      }
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
        return transformRouteData(response.data);
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
