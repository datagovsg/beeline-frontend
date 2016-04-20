import querystring from 'querystring';
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

    /**
    @param search: search parameters:
      @prop startLat Starting point latitude
      @prop startLng Starting point longitude
      @prop endLat Ending point latitude
      @prop endLng Ending point longitude
      @prop arrivalTime a Date object where the number of seconds
                since midnight is the desired arrival time at the
                destination
      @prop startTime A Date object.
                Restricts search results to routes with trips
                after this time
      @prop endTime a Date object.
                Restrict search results to routes with trips
                before this time
    **/
    searchRoutes: function(search) {
     //return Promise object
     return UserService.beeline({
       method: 'GET',
       url: '/routes/search_by_latlon?' + querystring.stringify({
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

    // // Get the list of routes close to given set of coordinates
    // searchRoutes: function(startLat, startLng, endLat, endLng) {
    //   return $http.get(SERVER_URL + '/routes/search_by_latlon?' + querystring.stringify({
    //     startLat: startLat,
    //     startLng: startLng,
    //     endLat: endLat,
    //     endLng: endLng,
    //     arrivalTime: '2016-02-26 01:00:00+00', //Doesn't do much right now so doesnt matter
    //     startTime: new Date().getTime(), //Start of search date
    //     endTime: new Date().getTime() + 30*24*60*60*1000 //End of search date
    //   }))
    //   .then(function(response) {
    //     console.log(response.data);
    //     return transformRouteData(response.data);
    //   });
    // }
  };
}
