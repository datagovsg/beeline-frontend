import _ from 'lodash';
import assert from 'assert';


export default function LiteRouteSubscriptionService($http, UserService) {
  var LiteRouteSubscriptionCache = null;
  var subscriptionsByLiteRouteId = null;
  return {

    getSubscriptions: function(ignoreCache) {
      if (LiteRouteSubscriptionCache && !ignoreCache) return LiteRouteSubscriptionCache;
      return LiteRouteSubscriptionCache = UserService.beeline({
        method: 'GET',
        url: '/liteRoutes/subscription',
      }).then((response) => {
        subscriptionsByLiteRouteId = _.groupBy(response.data, subs => subs.routeId);
        console.log(subscriptionsByLiteRouteId);
        return response.data;
			});
    }

  };
}
