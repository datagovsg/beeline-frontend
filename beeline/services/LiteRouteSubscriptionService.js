import _ from 'lodash';
import assert from 'assert';



export default function LiteRouteSubscriptionService($http, UserService, LiteRoutesService) {
  var LiteRouteSubscriptionCache = null;
  var subscriptionsByLiteRouteLabel = null;
  var subscriptions = null;
  return {

    getSubscriptions: function(ignoreCache) {
      if (LiteRouteSubscriptionCache && !ignoreCache) return LiteRouteSubscriptionCache;
      subscriptions = [];
      return LiteRouteSubscriptionCache = UserService.beeline({
        method: 'GET',
        url: '/liteRoutes/subscription',
      }).then( async(response) => {
        var allLiteRoutes = await LiteRoutesService.getLiteRoutes(ignoreCache);
        subscriptionsByLiteRouteLabel = _.groupBy(response.data, subs => subs.routeLabel);
        _(subscriptionsByLiteRouteLabel).forEach(function(value, key){
          console.log(allLiteRoutes[key].from);
          subscriptions.push({"label": key, "from": allLiteRoutes[key].from});
        });
        return subscriptions;
			});
    }

  };
}
