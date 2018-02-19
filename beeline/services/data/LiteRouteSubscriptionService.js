import assert from "assert"

angular.module("beeline").factory("LiteRouteSubscriptionService", [
  "UserService",
  "RequestService",
  "$q",
  function LiteRouteSubscriptionService(UserService, RequestService, $q) {
    let LiteRouteSubscriptionCache = null
    let liteRouteSubscriptionsSummary = []

    UserService.userEvents.on("userChanged", () => {
      instance.getSubscriptions(true)
    })

    let instance = {
      getSubscriptionSummary: function() {
        return liteRouteSubscriptionsSummary
      },

      getSubscriptions: function(ignoreCache) {
        if (UserService.getUser()) {
          if (LiteRouteSubscriptionCache && !ignoreCache) {
            return liteRouteSubscriptionsSummary
          }
          return (LiteRouteSubscriptionCache = RequestService.beeline({
            method: "GET",
            url: "/liteRoutes/subscriptions",
          }).then(response => {
            liteRouteSubscriptionsSummary = response.data.map(
              subs => subs.routeLabel
            )
            return liteRouteSubscriptionsSummary
          }))
        } else {
          liteRouteSubscriptionsSummary = []
          return $q.resolve([])
        }
      },

      isSubscribed: async function(label, ignoreCache) {
        let subscriptions = await this.getSubscriptions(ignoreCache)
        assert(subscriptions)

        let subscription = subscriptions.includes(label)
        if (subscription) {
          return true
        } else {
          return false
        }
      },
    }

    return instance
  },
])
