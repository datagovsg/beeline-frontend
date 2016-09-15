import _ from 'lodash';
import assert from 'assert';



export default function LiteRouteSubscriptionService($http, UserService, $q) {
  var LiteRouteSubscriptionCache = null;
  var subscriptionsByLiteRouteLabel = null;
  var liteRouteSubscriptionsSummary = [];

  return {

    getSubscriptionSummary: function() {
      return liteRouteSubscriptionsSummary;
    },

    getSubscriptions: function(ignoreCache) {
      if (UserService.getUser()) {
        if (LiteRouteSubscriptionCache && !ignoreCache) return liteRouteSubscriptionsSummary;
        return LiteRouteSubscriptionCache = UserService.beeline({
          method: 'GET',
          url: '/liteRoutes/subscriptions',
        }).then((response) => {
          subscriptionsByLiteRouteLabel = _.map(response.data, subs=>subs.routeLabel);
          liteRouteSubscriptionsSummary = subscriptionsByLiteRouteLabel.map((label) => {
            return label;
          })
          return liteRouteSubscriptionsSummary;
  			});
      }
      else {
        liteRouteSubscriptionsSummary = [];
        return $q.resolve([]);
      }
    },

    isSubscribed: async function(label, ignoreCache) {
      var subscriptions = await this.getSubscriptions(ignoreCache);
      assert(subscriptions);

      var subscription = subscriptions.includes(label)
      if (subscription) {
        return true;
      }
      else {
        return false;
      }
    }
  };
}
