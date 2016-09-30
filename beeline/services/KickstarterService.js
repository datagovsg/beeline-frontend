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
          url: '/custom/lelong/status',
        }).then((response) => {
          kickstarterSummary = response.data.map(x=>x.id);
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
      assert(bids);
      if (bids.includes(routeId)) {
        return true;
      }
      else {
        return false;
      }
    }
  }
}
