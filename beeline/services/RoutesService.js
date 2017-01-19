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

export default function RoutesService($http, UserService, uiGmapGoogleMapApi, $q, p) {
  // For all routes
  var routesCache;
  var activeRoutes;
  var recentRoutesCache;
  var recentRoutes;

  // For single routes
  var lastRouteId = null;
  var lastPromise = null;

  // For Route Credits
  var routeCreditsCache;
  var tagToCreditsMap;
  var routePassCache;
  var routeToRidesRemainingMap;
  var routesWithRoutePassPromise;
  var routesWithRoutePass;
  var activatedKickstarterRoutes;

  UserService.userEvents.on('userChanged', () => {
    instance.fetchRecentRoutes(true)
    instance.fetchRouteCredits(true)
    instance.fetchRoutesWithRoutePass()
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

    // Returns list of all routes
    getRoutes: function(){
      return activeRoutes
    },

    // Retrive the data on all the routes
    // But limits the amount of data retrieved
    // getRoutes() now returns a list of routes, but with very limited
    // trip data (limited to 5 trips, no path)
    // Return promise with all routes
    fetchRoutes: function(ignoreCache, options) {
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
      }, options,
      p.transportCompanyId ? {transportCompanyId: p.transportCompanyId}: {})

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
        activeRoutes = routes
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
    fetchRecentRoutes: function(ignoreCache) {
      if (UserService.getUser()) {
        if (recentRoutesCache && !ignoreCache) return recentRoutesCache;
        return recentRoutesCache = UserService.beeline({
          method: 'GET',
          url: '/routes/recent?limit=10'
        }).then(function(response) {
          recentRoutes = response.data
          return recentRoutes
        });
      } else {
        //if user not logged in clear recentRoutes
        recentRoutes = [];
        return $q.resolve([]);
      }
    },

    getRecentRoutes: function(){
      return recentRoutes
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

      // Destroy the cache for dependent calls
      // This is a hack
      routesWithRoutePassPromise = null;
      routePassCache = null;

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
    // - Object containing all routeCredits associated with user
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
    getRoutePassCount: function(){
      return routeToRidesRemainingMap
    },

    // Retrieve the amount of rides remaining for a specific route
    // input:
    // - ignoreCache - boolean to determine if cache should be ignored
    // output:
    // - promise containing a map of routeId to Rides Remaining
    fetchRoutePassCount: function(ignoreCache){
      if(ignoreCache || !routePassCache){
        let allRoutesPromise = this.fetchRoutes(ignoreCache)
        let allRouteCreditsPromise = this.fetchRouteCredits(ignoreCache)

        routePassCache = $q.all([allRoutesPromise, allRouteCreditsPromise]).then(function(values){
          let allRoutes = values[0]
          let allRouteCredits = values[1];
          let allRouteCreditTags = _.keys(allRouteCredits);
          routeToRidesRemainingMap = {}

          allRoutes.forEach(function(route){
            let notableTags = _.intersection(route.tags, allRouteCreditTags);
            if(notableTags.length < 1) return //not a kickstarter route
            if(notableTags.length > 1) {
              console.log("Error: Route has more than one kickstarter tag");
              return // something is wrong..
            }

            // calculate the rides left in the route pass
            let creditTag = notableTags[0]
            let price = route.trips[0].priceF
            if(price <= 0) return
            let creditsAvailable = parseFloat(allRouteCredits[creditTag])
            routeToRidesRemainingMap[route.id] = Math.floor(creditsAvailable / price)
          })

          return routeToRidesRemainingMap
        })

      }

      return routePassCache

    },

    // Generates a list of all routes, modifying those with route
    // credits remaining with a "ridesRemaining" property
    // input:
    // - ignoreCache: boolean determining if cache should be ignored.
    // carries over to dependencies fetchRoutes and fetchRoutePassCount
    // output:
    // - promise containing all routes, modified with ridesRemaining property
    // side effect:
    // - updates activatedKickstarterRoutes: array containing only those routes with
    // ridesRemaining property
    // - updates routesWithRoutePass: array containing all avaialable routes,
    // modifying those with route credits remaining with a ridesRemaining property
    fetchRoutesWithRoutePass: function(ignoreCache) {
      if(ignoreCache || !routesWithRoutePassPromise){
        return routesWithRoutePassPromise = $q.all([
          this.fetchRoutes(ignoreCache),
          this.fetchRoutePassCount(ignoreCache),
        ]).then(([allRoutes, routeToRidesRemainingMap]) => {
          let ksRouteIds = _.keys(routeToRidesRemainingMap)
          let allRoutesById = _.keyBy(allRoutes, 'id')

          let ksRoutes = ksRouteIds.map(
            id => allRoutesById[id]
          )

          ksRoutes.forEach(function(route){
            route.ridesRemaining = routeToRidesRemainingMap[route.id]
          });

          activatedKickstarterRoutes = ksRoutes
          routesWithRoutePass = allRoutes
          return routesWithRoutePass
        })

      }

      return routesWithRoutePassPromise

    },

    // Returns array containing all avaialable routes,
    // modifying those with route credits remaining with a ridesRemaining property
    // Updated by: fetchRoutesWithRoutePass
    getRoutesWithRoutePass: function() {
      return routesWithRoutePass
    },

    // Returns array containing only those routes with
    // ridesRemaining property
    // Updated by: fetchRoutesWithRoutePass
    getActivatedKickstarterRoutes: function(){
      return activatedKickstarterRoutes
    },


  };
  return instance;
}
