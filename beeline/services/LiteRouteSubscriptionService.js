import _ from 'lodash';
import assert from 'assert';



export default function LiteRouteSubscriptionService($http, UserService) {
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
          url: '/liteRoutes/subscription',
        }).then((response) => {
          subscriptionsByLiteRouteLabel = _.map(response.data, subs=>subs.routeLabel);
          liteRouteSubscriptionsSummary = subscriptionsByLiteRouteLabel.map((label) => {
            return label;
          })
          return liteRouteSubscriptionsSummary;
  			});
      }
      else {
        return $q.resolve([]);
      }
    },

    isSubscribed: async function(label) {
      var subscriptions = await this.getSubscriptions();
      console.log("the cache", subscriptions)
      assert(subscriptions);
      console.log("this are subscriptions:", subscriptions);

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
