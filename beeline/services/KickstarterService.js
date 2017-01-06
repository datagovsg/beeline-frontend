import querystring from 'querystring';
import _ from 'lodash';
import assert from 'assert';
import {SafeInterval} from '../SafeInterval';

var transformKickstarterData = function (kickstarterRoutes) {
  if (!kickstarterRoutes) return null;
  for (let kickstarter of kickstarterRoutes){
    kickstarter.isActived = false;
    if (kickstarter.bids && kickstarter.bids.length > 0) {
     var bidsByTier = _.groupBy(kickstarter.bids, x=>x.userOptions.price);
      kickstarter.notes.tier.map((tier)=>{
        var countCommitted = bidsByTier[tier.price] ?  bidsByTier[tier.price].length :0;
        _.assign(tier, {count: countCommitted,
                        moreNeeded: Math.max(tier.pax-countCommitted, 0)})
      })
    } else {
      kickstarter.notes.tier.map((tier)=>{
        _.assign(tier, {count: 0, moreNeeded: tier.pax})
      })
    }
    //order tiers in price desc order
    kickstarter.notes.tier = _.orderBy(kickstarter.notes.tier, x=>x.price, "desc");
    //if sb. commit $8, also commit $5
    // kickstarter.notes.tier[1].count += kickstarter.notes.tier[0].count;
    kickstarter.isActived = kickstarter.notes.tier[0].moreNeeded==0;

    kickstarter.isExpired = false;
    kickstarter.is7DaysOld = false;
    var now = new Date().getTime();
    if (kickstarter.notes && kickstarter.notes.lelongExpiry) {
      var expiryTime = new Date(kickstarter.notes.lelongExpiry).getTime();
      if (now >= expiryTime) {
        kickstarter.isExpired = true;
        if (now - expiryTime >= 7*1000*60*60*24) {
          kickstarter.is7DaysOld = true;
        }
      } else{
        var day = 1000  * 60 * 60 * 24;
        kickstarter.daysLeft =  Math.ceil((expiryTime - now)/day);
      }
    }

    //filter only isRunning trips
    //sort trips date in ascending order
    kickstarter.trips = _(kickstarter.trips).filter(x=>x.isRunning)
                                            .orderBy(x=>x.date)
                                            .value();
    //sort tripStops time in ascending order
    _.forEach(kickstarter.trips, function(trip){
      trip.tripStops = _.orderBy(trip.tripStops, stop=>stop.time)
    });

    //calculate the pass expiry date
    kickstarter.passExpired = false;
    var firstTripDate = new Date(kickstarter.trips[0].date);
    var passExpiryTime = new Date(firstTripDate.getFullYear(), firstTripDate.getMonth()+1, firstTripDate.getDate()).getTime();
    kickstarter.passExpired =  (now >= passExpiryTime);
    updateStatus(kickstarter);
  }
  return kickstarterRoutes;
}

var updateStatus = function(route){
  //status of kickstarter
  route.status = "";
  if ((route.notes.tier[0].moreNeeded==0)) {
    route.status = "Yay! Route is activated at $" + route.notes.tier[0].price.toFixed(2) + " per trip."
  } else if (!route.isExpired) {
    route.status = route.notes.tier[0].moreNeeded + " more pax to activate the route at $"+route.notes.tier[0].price.toFixed(2)+" per trip."
  } else {
    route.status = "Campaign has expired and the route is not activated."
  }
}

var updateAfterBid = function(route, price) {
  route.notes.tier[0].count = route.notes.tier[0].count + 1;
  route.notes.tier[0].moreNeeded = Math.max(route.notes.tier[0].moreNeeded-1 ,0);
  route.isActived = route.notes.tier[0].moreNeeded==0;
  updateStatus(route);
}

export default function KickstarterService($http, UserService,$q, $rootScope) {
  var kickstarterRoutesCache;
  var bidsCache;
  var kickstarterSummary = null, bidsById = null;
  var kickstarterRoutesList = null, kickstarterRoutesById = null;

  UserService.userEvents.on('userChanged', () => {
    fetchBids(true);
    //to load route credits
    UserService.fetchRouteCredits(true);
  })

  //first load
  // every 1 hour should reload kickstarter information
  var timeout = new SafeInterval(refresh, 1000*60*60, 1000*60);

  function refresh() {
    return Promise.all([fetchKickstarterRoutes(true),fetchBids(true)]);
  }

  timeout.start();

  function fetchBids(ignoreCache) {
    if (UserService.getUser()) {
      if (bidsCache && !ignoreCache) return bidsCache;
      return bidsCache = UserService.beeline({
        method: 'GET',
        url: '/custom/lelong/bids',
      }).then((response) => {
        // kickstarterSummary = response.data;
        kickstarterSummary = response.data.map((bid)=>{
          return   {routeId: bid.id,
                    boardStopId: bid.bid.tickets[0].boardStop.stopId,
                    alightStopId: bid.bid.tickets[0].alightStop.stopId,
                    bidPrice: bid.bid.userOptions.price}
        })
        bidsById = _.keyBy(kickstarterSummary, r=>r.routeId);
        return kickstarterSummary;
			});
    }
    else {
      kickstarterSummary = [];
      return $q.resolve(kickstarterSummary);
    }
  }

  function fetchKickstarterRoutes(ignoreCache) {
    if (kickstarterRoutesCache && !ignoreCache) return kickstarterRoutesCache;
    return kickstarterRoutesCache = UserService.beeline({
      method: 'GET',
      url: '/custom/lelong/status',
    }).then((response)=>{
      //return expired kickstarter too
      kickstarterRoutesList = transformKickstarterData(response.data);
      kickstarterRoutesById = _.keyBy(kickstarterRoutesList, 'id')
      return kickstarterRoutesList
    })
  }


  return {
    //all lelong routes
    getLelong: () => kickstarterRoutesList,
    fetchLelong: (ignoreCache)=>fetchKickstarterRoutes(ignoreCache),

    getLelongById: function(routeId) {
      return  kickstarterRoutesById ?  kickstarterRoutesById[routeId] : null;
    },

    //user personal bid information
    getBids: function() {
      return kickstarterSummary
    },
    fetchBids: (ignoreCache)=>fetchBids(ignoreCache),

    isBid: function(routeId) {
      return  bidsById && bidsById[routeId] ? true : false
    },

    getBidInfo: function(routeId) {
      return kickstarterSummary ?  kickstarterSummary.find(x=>x.routeId == routeId) : null;
    },

    //need to return a promise
    hasBids: function() {
      return bidsCache.then(()=>{
        return kickstarterSummary && kickstarterSummary.length>0;
      })
    },

    createBid: function(route, boardStopId, alightStopId,bidPrice) {
      return UserService.beeline({
        method: 'POST',
        url: '/custom/lelong/bid',
        data: {
          trips: route.trips.map(trip => ({
            tripId: trip.id,
            boardStopId: boardStopId,
            alightStopId: alightStopId,
          })),
          promoCode: {
            code: 'LELONG',
            options: {price: bidPrice}
          }
        }
      }).then((response)=>{
        updateAfterBid(kickstarterRoutesById[route.id], bidPrice);
        kickstarterSummary = kickstarterSummary.concat([{
          routeId: route.id,
          boardStopId: boardStopId,
          alightStopId: alightStopId,
          bidPrice: bidPrice
        }])
        return response.data;
      })
    }

  }
}
