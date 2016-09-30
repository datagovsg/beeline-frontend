import querystring from 'querystring';
import _ from 'lodash';
import assert from 'assert';


export default function KickstarterService($http, UserService,$q) {
  var kickstarterStatusCache;
  var kickstarterSummary;

  return {

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
      var bidsId = bids.map(x=>x.id);
      assert(bids);
      if (bidsId.includes(routeId)) {
        return true;
      }
      else {
        return false;
      }
    },

    getBidInfo: async function(routeId, ignoreCache) {
      console.log(routeId);
      var bids = await this.getBids(ignoreCache);
      assert(bids);
      var info =bids.filter(x=>{return x.id==routeId});
      console.log(info);
      return info;
    },

    createBid: async function(route, bidPrice) {
      var promise =  await UserService.beeline({
        method: 'POST',
        url: '/custom/lelong/bid',
        data: {
          trips: route.trips.map(trip => ({
            tripId: trip.id,
            boardStopId: trip.tripStops[0].id,
            alightStopId: trip.tripStops[1].id,
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
