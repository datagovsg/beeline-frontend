import querystring from 'querystring';
import _ from 'lodash';
import assert from 'assert';

// Adapter function to convert what we get from the server into what we want
// Ideally shouldn't need this if the server stays up to date
// Transforms the data in place rather than making a new array
// This is to save time since its a deep copy
// and you wont need the original array anyway
function transformRouteData(data) {
  _(data).each(function(route) {
    for (let trip of route.trips) {
      assert.equal(typeof trip.date, 'string');
      trip.date = new Date(trip.date);

      for (let tripStop of trip.tripStops) {
        assert.equal(typeof tripStop.time, 'string');
        tripStop.time = new Date(tripStop.time);
      }
    }

    var firstTripStops = route.trips[0].tripStops;
    route.startTime = firstTripStops[0].time;
    route.startRoad = firstTripStops[0].stop.description;
    route.endTime = firstTripStops[firstTripStops.length - 1].time;
    route.endRoad = firstTripStops[firstTripStops.length - 1].stop.description;
    route.tripsByDate = _.keyBy(route.trips,
        trip => trip.date.getTime());
  });
  return data;
}

export default function RoutesService($http, SERVER_URL, UserService) {

  var routesCache;
  var recentRoutesCache;

  var instance = {

    // Retrive the data on a single route
    // TODO refactor this to match getRoutes and searchRoutes
    getRoute: function(routeId, ignoreCache, options) {
      assert.equal(typeof routeId, 'number');
      return instance.getRoutes(ignoreCache, options)
      .then(function(routes) {
        return _.find(routes, {id: routeId});
      });
    },

    // Retrive the data on all the routes
    getRoutes: function(ignoreCache, options) {
      if (routesCache && !ignoreCache && !options) return Promise.resolve(routesCache);

      var url = '/routes?include_trips=true';

      // Start at midnight to avoid cut trips in the middle
      // FIXME: use date-based search instead
      var startDate = new Date();
      startDate.setHours(3,0,0,0,0)
      var endDate = new Date(startDate.getTime() + 30*24*60*60*1000);

      var options = _.assign({
        start_date: startDate.getTime(),
        end_date: endDate.getTime(),
      }, {})

      if (options) {
        url += '&' + querystring.stringify(options)
      }

      return UserService.beeline({
        method: 'GET',
        url: url,
      })
      .then(function(response) {
        transformRouteData(response.data)
        if (!options) {
          routesCache = response.data;
        }
        return response.data;
      });
    },

    /**
    @param {Object} search - search parameters:
    @param {number} search.startLat Starting point latitude
    @param {number} search.startLng Starting point longitude
    @param {number} search.endLat Ending point latitude
    @param {number} search.endLng Ending point longitude
    @param {Date} search.arrivalTime a Date object where the number of seconds
                  since midnight is the desired arrival time at the destination
    @param {Date} search.startTime A Date object.
                Restricts search results to routes with trips
                after this time
    @param {Date} search.endTime a Date object.
                Restrict search results to routes with trips
                before this time
    @return {Promise}
    **/
    searchRoutes: function(search) {
      // return Promise object
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

    // Retrieves the recent routes for a user
    // If not logged in then just returns an empty array
    getRecentRoutes: function(ignoreCache) {
      if (UserService.getUser()) {
        if (recentRoutesCache && !ignoreCache) return Promise.resolve(recentRoutesCache);
        return UserService.beeline({
          method: 'GET',
          url: '/routes/recent?limit=10'
        }).then(function(response) {
          recentRoutesCache = response.data;
          return recentRoutesCache;
        });
      } else {
        return Promise.resolve([]);
      }
    },
  };

  return instance;
}
