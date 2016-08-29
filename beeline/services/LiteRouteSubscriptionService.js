import _ from 'lodash';
import assert from 'assert';



export default function LiteRouteSubscriptionService($http, UserService, LiteRoutesService) {
  var LiteRouteSubscriptionCache = null;
  var subscriptionsByLiteRouteLabel = null;
  var subscriptions = null;
  return {
    getSubscriptions: function(ignoreCache) {
      if (LiteRouteSubscriptionCache && !ignoreCache) return LiteRouteSubscriptionCache;
      return LiteRouteSubscriptionCache = UserService.beeline({
        method: 'GET',
        url: '/liteRoutes/subscription',
      }).then((response) => {
        subscriptionsByLiteRouteLabel = _.map(response.data, subs=>subs.routeLabel);
        return Promise.all(subscriptionsByLiteRouteLabel.map(async(label) => {
          var liteRoute = await LiteRoutesService.getLiteRoute(label, ignoreCache);
          return {"label": label, "from": liteRoute[label].from, "liteRoute": liteRoute[label]};
        }))
			});
    },

    isSubscribed: async function(label) {
      if (!LiteRouteSubscriptionCache) {
        await getSubscriptions(true);
      }
      var subscription = _.find(LiteRouteSubscriptionCache, {"label": label})
      if (subscription) {
        return true;
      }
      else {
        return false;
      }
    }

  };
}
