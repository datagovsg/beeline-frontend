// get lite routes
// format lite routes with starting time, ending time, no. of timings/trips per day
// retrieve lists of trips running for certain lite route on certain date
// driver pings for list of trips running for this route
// subscriptions for certain lite route ( this may go to tickets service)
import querystring from 'querystring';
import _ from 'lodash';

export default function LiteRouteService($http, UserService, $q) {

  var liteRoutesCache;
  var liteRoutesPromise;

  function transformLiteRouteData(data) {

    _(data).each(function(route) {
      route.tripsByDate = _.groupBy(route.trips, trip => new Date(trip.date).getTime());
      for (var index in route.tripsByDate){
        route.interval = route.tripsByDate[index].length;
        var trips = _.sortBy(route.tripsByDate[index], 'id');
        console.log(trips);
        var totalStops = trips[route.interval-1].tripStops.length;
        route.startTime = trips[0].tripStops[0].time;
        route.endTime = trips[trips.length-1].tripStops[totalStops-1].time;
        console.log(route.startTime);
        console.log(route.endTime);
        break;
      }
      console.log(route.tripsByDate);
    })
    console.log(data);
  }

  var instance = {
    // Retrive the data on all lite routes
    // But limits the amount of data retrieved
    // getRoutes() now returns a list of routes, but with very limited
    // trip data (limited to 5 trips, no path)
    getLiteRoutes: function(ignoreCache, options) {
      if (liteRoutesCache && !ignoreCache && !options) return liteRoutesCache;

      var url = '/routes?';

      // Start at midnight to avoid cut trips in the middle
      // FIXME: use date-based search instead
      var startDate = new Date();
      startDate.setHours(3,0,0,0,0)

      var finalOptions = _.assign({
        start_date: startDate.getTime(),
        include_trips: true,
        limit_trips: 20,
        include_path: false,
        tags: JSON.stringify(['lite']),
      }, options)

      url += querystring.stringify(finalOptions)

      var liteRoutesPromise = UserService.beeline({
        method: 'GET',
        url: url,
      })
      .then(function(response) {
        // Checking that we have trips, so that users of it don't choke
        // on trips[0]
        var liteRoutes = response.data.filter(r => r.trips && r.trips.length);
        transformLiteRouteData(liteRoutes)
        return liteRoutes;
      });

      // Cache the promise -- prevents two requests from being
      // in flight together
      if (!options)
        liteRoutesCache = liteRoutesPromise;

      return liteRoutesPromise;
    },


    subscribeLiteRoute: function(liteRouteId) {
      var subscribePromise = UserService.beeline({
        method: 'POST',
        url: '/liteRoutes/subscription',
        data: {
          routeId: liteRouteId,
        }
      })
      .then(function(response) {
        console.log(response.data);
        if (response.data) {
          return true;
        }
        else{
          console.log("Fails");
          return false;
        }
      });
      return subscribePromise;
    }


  };

  return instance;
}
