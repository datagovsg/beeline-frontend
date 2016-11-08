import querystring from 'querystring';
import _ from 'lodash';
import assert from 'assert';

var transformKickstarterData = function (kickstarterRoutes) {
  if (!kickstarterRoutes) return null;
  for (let kickstarter of kickstarterRoutes){
    if (kickstarter.bids && kickstarter.bids.length > 0) {
     var bidsByTier = _.groupBy(kickstarter.bids, x=>x.userOptions.price);
      kickstarter.notes.tier.map((tier)=>{
        var countCommitted = bidsByTier[tier.price] ?  bidsByTier[tier.price].length :0;
        _.assign(tier, {count: countCommitted,
                        moreNeeded: tier.pax-countCommitted})
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

    kickstarter.isExpired = false;
    kickstarter.is7DaysOld = false;
    if (kickstarter.notes && kickstarter.notes.lelongExpiry) {
      var now = new Date().getTime();
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

    //status of kickstarter
    kickstarter.status = "";
    if ((kickstarter.notes.tier.some((tier)=>tier.moreNeeded==0))) {
      kickstarter.status = "Bus is on at $" + kickstarter.notes.tier[0].price
    } else if (!kickstarter.isExpired) {
      kickstarter.status = kickstarter.notes.tier[0].moreNeeded + " more to activated the route at $"+kickstarter.notes.tier[0].price
    } else {
      kickstarter.status = "Bus is not activated"
    }
  }
  return kickstarterRoutes;
}

var increaseBidNo = function(route, price) {
  for (let tier of route.notes.tier) {
    if (tier.price <= price) {
      tier.count++;
    }
  }
}

export default function KickstarterService($http, UserService,$q, $rootScope) {
  var lelongCache;
  var kickstarterStatusCache;
  var kickstarterSummary = [], bidsById = {};
  var kickstarterRoutesList = [], kickstarterRoutesById = {};

  UserService.userEvents.on('userChanged', () => {
    fetchBids(true);
  })

  //first load
  fetchKickstarterRoutes(true);
  fetchBids(true);

  function fetchBids(ignoreCache) {
    if (UserService.getUser()) {
      if (kickstarterStatusCache && !ignoreCache) return kickstarterStatusCache;
      return kickstarterStatusCache = UserService.beeline({
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
    if (lelongCache && !ignoreCache) return lelongCache;
    return lelongCache = UserService.beeline({
      method: 'GET',
      url: '/custom/lelong/status',
    }).then((response)=>{
      // kickstarterRoutesList = transformKickstarterData(response.data).filter((kickstarter)=>{
      //   return !kickstarter.isExpired;
      // });
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
      return kickstarterRoutesById[routeId];
    },

    //user personal bid information
    getBids: function() {
      return kickstarterSummary
    },
    fetchBids: (ignoreCache)=>fetchBids(ignoreCache),

    isBid: function(routeId) {
      return bidsById[routeId] ? true : false
    },

    getBidInfo: function(routeId) {
      return kickstarterSummary.find(x=>x.routeId == routeId);
    },

    createBid: function(route, boardStopId, alightStopId,bidPrice) {
      return UserService.beeline({
        method: 'POST',
        url: '/custom/lelong/bid',
        data: {
          trips: route.trips.map(trip => ({
            tripId: trip.id,
            boardStopId: trip.tripStops.filter((x)=>{
              return x.stopId === boardStopId;
            })[0].id,
            alightStopId: trip.tripStops.filter((x)=>{
              return x.stopId === alightStopId;
            })[0].id,
          })),
          promoCode: {
            code: 'LELONG',
            options: {price: bidPrice}
          }
        }
      }).then((response)=>{
        increaseBidNo(kickstarterRoutesById[route.id], bidPrice);
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
