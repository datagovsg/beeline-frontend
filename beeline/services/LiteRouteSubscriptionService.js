import _ from 'lodash';
import assert from 'assert';



export default function LiteRouteSubscriptionService($http, UserService, LiteRoutesService, $q) {
  var LiteRouteSubscriptionCache = null;
  var subscriptionsByLiteRouteLabel = null;
  var subscriptions = null;
  return {
    getSubscriptions: function(ignoreCache) {
      if (UserService.getUser()) {
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
      }
      else {
        return $q.resolve([]);
      }
    },

    isSubscribed: async function(label) {
      var subscriptions = await this.getSubscriptions();
      assert(subscriptions);

      var subscription = _.find(subscriptions, {"label": label})
      if (subscription) {
        return true;
      }
      else {
        return false;
      }
    }
  };
}
