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

export default function RoutesService($http, UserService, uiGmapGoogleMapApi, $q) {
  // For all routes
  var routesCache;
  var recentRoutesCache;

  // For kickstarter routes
  var kickstarterRoutesCache;

  // For single routes
  var lastRouteId = null;
  var lastPromise = null;

  // For Route Credits 
  var routeCreditsCache;
  var tagToCreditsMap;

  UserService.userEvents.on('userChanged', () => {
    instance.fetchRouteCredits()
    console.log("To Implement: Refresh cache on route credits on user change")
  })

  var instance = {

    // Retrive the data on a single route, but pulls a lot more data
    // Pulls all the trips plus the route path
    // getRoute() will return the heavier stuff (all trips, availability, path)
    getRoute: function(routeId, ignoreCache, options) {
      assert.equal(typeof routeId, 'number');

      if (!ignoreCache && !options && lastRouteId === routeId) {
        return lastPromise;
      }

      var startDate = new Date();
      startDate.setHours(3,0,0,0,0)

      var finalOptions = _.assign({
        start_date: startDate.getTime(),
        include_trips: true,
        include_availability: true,
      }, options)

      lastRouteId = routeId;
      return lastPromise = UserService.beeline({
        method: 'GET',
        url: `/routes/${routeId}?${querystring.stringify(finalOptions)}`,
      })
      .then(function(response) {
        transformRouteData([response.data]);
        return response.data;
      })
      .catch((err) => {
        console.error(err);
      });
    },

    // Retrive the data on all the routes
    // But limits the amount of data retrieved
    // getRoutes() now returns a list of routes, but with very limited
    // trip data (limited to 5 trips, no path)
    getRoutes: function(ignoreCache, options) {
      if (routesCache && !ignoreCache && !options) return routesCache;

      var url = '/routes?';

      // Start at midnight to avoid cut trips in the middle
      // FIXME: use date-based search instead
      var startDate = new Date();
      startDate.setHours(3,0,0,0,0)

      var finalOptions = _.assign({
        start_date: startDate.getTime(),
        include_trips: true,
        limit_trips: 5,
        include_path: false,
        tags: JSON.stringify(['public']),
      }, options)

      url += querystring.stringify(finalOptions)

      var routesPromise = UserService.beeline({
        method: 'GET',
        url: url,
      })
      .then(function(response) {
        // Checking that we have trips, so that users of it don't choke
        // on trips[0]
        var routes = response.data.filter(r => r.trips && r.trips.length);
        transformRouteData(routes)
        return routes;
      });

      // Cache the promise -- prevents two requests from being
      // in flight together
      if (!options)
        routesCache = routesPromise;

      return routesPromise;
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
          endTime: search.endTime,
          tags: JSON.stringify(['public'])
        }),
      }).then(function(response) {
        return transformRouteData(response.data);
      });
    },

    // Retrieves the recent routes for a user
    // If not logged in then just returns an empty array
    getRecentRoutes: function(ignoreCache) {
      if (UserService.getUser()) {
        if (recentRoutesCache && !ignoreCache) return recentRoutesCache;
        return recentRoutesCache = UserService.beeline({
          method: 'GET',
          url: '/routes/recent?limit=10'
        }).then(function(response) {
          return response.data
        });
      } else {
        return $q.resolve([]);
      }
    },

// TODO: make a directive, otherwise literoute need to inject this routeservice
    decodeRoutePath: function (path) {
      assert.strictEqual(typeof path, 'string');
      return uiGmapGoogleMapApi.then((googleMaps) => {
        // Array of LatLng objects
        return googleMaps.geometry.encoding.decodePath(path);
      })
    },

    getRouteFeatures: function (routeId) {
      return UserService.beeline({
        method: 'GET',
        url: `/routes/${routeId}/features`,
      })
      .then(function(response) {
        return response.data;
      })
      .catch((err) => {
        console.error(err);
      });
    },

// Return an array of regions covered by a given array of routes
    getUniqueRegionsFromRoutes: function(routes) {
      return _(routes).map(function(route) {return route.regions;})
      .flatten()
      .uniqBy('id')
      .sortBy('name')
      .value();
    },

    // get all routeCredits associated with the user
    // performs db query where necessary or specified
    // input:
    // - ignoreCache - boolean
    // output:
    // - Promise containing all routeCredits associated with user
    fetchRouteCredits: function(ignoreCache){
      let user = UserService.getUser();
      if(!user){
        tagToCreditsMap = {};
        return $q.resolve(tagToCreditsMap)
      }
      if(!ignoreCache && routeCreditsCache){
        return routeCreditsCache
      }

      return routeCreditsCache = UserService.beeline({
        method: 'GET',
        url: '/routeCredits'
      }).then((response) => {
        tagToCreditsMap = response.data
        return tagToCreditsMap
      })

    },

    // Retrieve routeCredits information from cache
    // input: 
    // - tag - String: tag associated with route. optional
    // output:
    // - Promise containing all routeCredits associated with user
    // - [tag provided] amount of credits specific to the tag
    getRouteCredits: function(tag){
      if(tag){
        return tagToCreditsMap[tag]
      } else {
        return tagToCreditsMap
      }
    },

    // Retrieve the amount of rides remaining for a specific route
    // input:
    // - routeId - number: id of route
    // - creditTag - string: tag associated with route
    // output:
    // - promise containing number of rides remaining on the route pass for specified route
    getRoutePassCount: function(routeId, creditTag){
      let routePromise = this.getRoute(routeId, true)
      let routeCreditsPromise = this.fetchRouteCredits()
      
      return $q.all([routePromise, routeCreditsPromise]).then(function(values){
        let creditsAvailable = parseFloat(values[1][creditTag])
        let ticketPrice = values[0].trips[0].priceF
        let ridesRemaining = Math.floor(parseFloat(creditsAvailable)/ticketPrice)

        return ridesRemaining
      })

    }

  };
  return instance;
}
