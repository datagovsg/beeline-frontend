import querystring from 'querystring';
import _ from 'lodash';
import assert from 'assert';

var transformKickstarterData = function (kickstarterRoutes) {
  if (!kickstarterRoutes) return null;
  for (let kickstarter of kickstarterRoutes){
    console.log(kickstarter);

    if (kickstarter.bids && kickstarter.bids.length > 0) {
     var bidsByTier = _.groupBy(kickstarter.bids, x=>x.userOptions.price);
     console.log(kickstarter.notes.tier)
      kickstarter.notes.tier.map((tier)=>{
        if (bidsByTier[tier.price]) {
          console.log(bidsByTier[tier.price]);
          console.log(bidsByTier[tier.price].length);
        }

        _.assign(tier, {no: bidsByTier[tier.price] ?  bidsByTier[tier.price].length :0})
      })
    } else {
      kickstarter.notes.tier.map((tier)=>{
        _.assign(tier, {no: 0})
      })
    }
    //order tiers in price desc order
    kickstarter.notes.tier = _.orderBy(kickstarter.notes.tier, x=>x.price, "desc");
    //if sb. commit $8, also commit $5
    kickstarter.notes.tier[1].no += kickstarter.notes.tier[0].no;

    kickstarter.isValid = true;
    if (kickstarter.notes && kickstarter.notes.lelongExpiry) {
      var now = new Date().getTime();
      var expiryTime = new Date(kickstarter.notes.lelongExpiry).getTime();
      if (now >= expiryTime) {
        kickstarter.isValid = false;
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
  }
  return kickstarterRoutes;
}

export default function KickstarterService($http, UserService,$q) {
  var lelongCache;
  var kickstarterStatusCache;
  var kickstarterSummary;

  return {
    //all lelong routes
    getLelong: function(ignoreCache) {
      if (lelongCache && !ignoreCache) return lelongCache;
      return lelongCache = UserService.beeline({
        method: 'GET',
        url: '/custom/lelong/status',
      }).then((response)=>{
        return transformKickstarterData(response.data).filter((kickstarter)=>{
          return kickstarter.isValid;
        });
      })
    },

    getLelongById: async function(routeId, ignoreCache) {
      var response = await this.getLelong(ignoreCache);
      var bid = response.filter(x=>x.id==routeId);
      return bid.length>0 ? bid[0] : null;
    },

    //user personal bid information
    getBids: function(ignoreCache) {
      if (UserService.getUser()) {
        if (kickstarterStatusCache && !ignoreCache) return kickstarterStatusCache;
        return kickstarterStatusCache = UserService.beeline({
          method: 'GET',
          url: '/custom/lelong/bids',
        }).then((response) => {
          kickstarterSummary = response.data;
          return kickstarterSummary;
  			});
      }
      else {
        kickstarterSummary = [];
        return $q.resolve([]);
      }
    },

    isBid: async function(routeId, ignoreCache) {
      var bids = await this.getBids(ignoreCache);
      if (bids.length == 0){
        return false;
      }
      assert(bids);
      var bidsId = bids.map(x=>x.id);
      if (bidsId.includes(routeId)) {
        return true;
      }
      else {
        return false;
      }
    },

    hasBids: async function(ignoreCache) {
      var bids = await this.getBids(ignoreCache);
      return bids.length > 0;
    },

    getBidInfo: async function(routeId, ignoreCache) {
      var bids = await this.getBids(ignoreCache);
      assert(bids);
      var info =bids.filter(x=>{return x.id==routeId});
      return info.length>0 ? info[0] : null;
    },

    createBid: async function(route, boardStopId, alightStopId,bidPrice) {
      var promise =  await UserService.beeline({
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
      });
      if (promise) {
        this.getBids(true);
      }
      return promise.data;
    },

    deleteBid: async function(routeId) {
      var promise = await UserService.beeline({
        method: 'DELETE',
        url: '/custom/lelong/bids/'+routeId
      });
      if (promise) {
        this.getBids(true);
      }
      return promise.data;
    }
  }
}
