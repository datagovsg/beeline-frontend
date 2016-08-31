import _ from 'lodash';
import assert from 'assert';



export default function LiteRouteSubscriptionService($http, UserService) {
  var LiteRouteSubscriptionCache = null;
  var subscriptionsByLiteRouteLabel = null;
  var liteRouteSubscriptionsSummary = [];

  return {

    setSubscribed(label, isSubscribed) {

    },

    getSubscribed(label, isSubscribed) {

    },

    getSubscriptionSummary: function(){
      console.log("cachethis", liteRouteSubscriptionsSummary)
      return liteRouteSubscriptionsSummary;
    },

    getSubscriptions: function(ignoreCache) {
      if (UserService.getUser()) {
        if (LiteRouteSubscriptionCache && !ignoreCache) return LiteRouteSubscriptionCache;
        return LiteRouteSubscriptionCache = UserService.beeline({
          method: 'GET',
          url: '/liteRoutes/subscription',
        }).then((response) => {
          subscriptionsByLiteRouteLabel = _.map(response.data, subs=>subs.routeLabel);
          liteRouteSubscriptionsSummary = subscriptionsByLiteRouteLabel.map((label) => {
            return {"label": label, "isSubscribed": true};
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
      assert(subscriptions);
      console.log("this are subscriptions:", subscriptions);

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
