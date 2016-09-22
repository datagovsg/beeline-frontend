// get lite routes
// format lite routes with starting time, ending time, no. of timings/trips per day
// retrieve lists of trips running for certain lite route on certain date
// driver pings for list of trips running for this route
// subscriptions for certain lite route ( this may go to tickets service)
import querystring from 'querystring';
import _ from 'lodash';
import assert from 'assert';

export default function LiteRoutesService($http, UserService, $q, LiteRouteSubscriptionService) {

  var liteRoutesCache;
  var liteRoutesPromise;

  // For single lite route
  var lastLiteRouteLabel = null;
  var lastLiteRoutePromise = null;
  function transformTime(liteRoutesByLabel) {
    for (let label in liteRoutesByLabel){
      var liteRoute = liteRoutesByLabel[label]
      //no starting time and ending time
      if (!liteRoute.trips) {
        liteRoute.startTime = null;
        liteRoute.endTime = null;
        return;
      }
      var tripByDates = _.partition(liteRoute.trips, function(trip) { return trip.date; });
      var allTripStops = _.flatten(tripByDates[0].map(trip=>trip.tripStops));
      var allStopTimes = allTripStops.map(stop=>stop.time).sort();
      liteRoute.startTime = allStopTimes[0];
      liteRoute.endTime = allStopTimes[allStopTimes.length-1];
    }
  }

  function transformLiteRouteData(data) {
    var liteRoutesByLabel = _.reduce(data, function(result,value, key){
      var label = value.label;
      if (result[label] && (result[label].trips || value.trips)) {
        result[label].trips = result[label].trips.concat(value.trips);
      }
      else {
        result[label] = value;
        //mark isSubscribed as false
        result[label].isSubscribed = false;
      }
      return result;
    },{});
    transformTime(liteRoutesByLabel);
    //ignor the startingTime and endTime for now
    return liteRoutesByLabel;
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
        include_path: false,
        include_trips: true,
        limit_trips: 5,
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
        liteRoutes = transformLiteRouteData(liteRoutes)
        return liteRoutes;
      });

      // Cache the promise -- prevents two requests from being
      // in flight together
      if (!options)
        liteRoutesCache = liteRoutesPromise;
      return liteRoutesPromise;
    },

    getLiteRoute: function(liteRouteLabel, ignoreCache, options) {
      assert.equal(typeof liteRouteLabel, 'string');

      if (!ignoreCache && !options && lastLiteRouteLabel=== liteRouteLabel) {
        console.log(`Using lite route ${liteRouteLabel} from cache`);
        return lastLiteRoutePromise;
      }

      var startDate = new Date();
      startDate.setHours(3,0,0,0,0)

      var finalOptions = _.assign({
        start_date: startDate.getTime(),
        include_trips: true,
        tags: JSON.stringify(['lite']),
        label: liteRouteLabel,
        include_path: true,
      }, options)

      var url = '/routes?';
      url+= querystring.stringify(finalOptions);

      lastLiteRouteLabel = liteRouteLabel;
      return lastLiteRoutePromise = UserService.beeline({
        method: 'GET',
        url: url,
      })
      .then(function(response) {
        var liteRouteData =  transformLiteRouteData(response.data);
        return liteRouteData;
      })
      .catch((err) => {
        console.error(err);
      });
    },


    subscribeLiteRoute: function(liteRouteLabel) {
      var subscribePromise = UserService.beeline({
        method: 'POST',
        url: '/liteRoutes/subscriptions',
        data: {
          routeLabel: liteRouteLabel,
        }
      })
      .then(function(response) {
        if (response.data) {
          LiteRouteSubscriptionService.getSubscriptionSummary().push(liteRouteLabel)
          return true;
        }
        else{
          return false;
        }
      });
      return subscribePromise;
    },

    unSubscribeLiteRoute: function(liteRouteLabel) {

      var unSubscribePromise = UserService.beeline({
        method: 'DELETE',
        url: '/liteRoutes/subscriptions/'+liteRouteLabel
      })
      .then(function(response) {
        if (response.data) {
          var index = LiteRouteSubscriptionService.getSubscriptionSummary().indexOf(liteRouteLabel)
          LiteRouteSubscriptionService.getSubscriptionSummary().splice(index, 1)
          return true;
        }
        else{
          return false;
        }
      });
      return unSubscribePromise;
    },

    //consolidate tripstops for lite route
    //aggregate stop time for stops
    computeLiteStops: function(trips) {
      var tripStops = _.map(trips, (trip)=>{return trip.tripStops});
      var allTripStops = _.flatten(tripStops);

      var boardStops = _.groupBy(allTripStops, function(tripStop){
        return tripStop.stop.id
      });
      var newStops = [];
      for (let stopId in boardStops){
        var stop = boardStops[stopId][0].stop;
        var timeArray = _.map(boardStops[stopId], (stop)=>{
          return stop.time
        })
        var sortedTime = _(timeArray).uniq().sort().value();
        newStops.push(_.extend({"time": sortedTime}, stop));
      }
      return newStops;
    }

  };

  return instance;
}
