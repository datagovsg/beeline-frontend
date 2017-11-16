
angular.module('beeline').factory('PersonalRoutesService', ['RoutesService', 'LiteRoutesService',
  'LiteRouteSubscriptionService', 'KickstarterService', 'UserService',
  function personalRoutes(RoutesService, LiteRoutesService, LiteRouteSubscriptionService, KickstarterService,
    UserService) {
    let routes, bookingRoutes, subscribedLiteRoutes, activatedCrowdstartRoutes, biddedCrowdstartRoutes = null;
    function retrieve() {
      return new Promise((resolve, reject) => {
        if (UserService.getUser() == null) {
          return resolve([])
        } else {
          return Promise.all([RoutesService.fetchRecentRoutes(), RoutesService.fetchRoutesWithRoutePass(),
            LiteRoutesService.fetchLiteRoutes(), LiteRouteSubscriptionService.getSubscriptions()])
            .then(([recentRoutes, allRoutes, liteRoutes, subscribed]) => {

              // booking routes
              if (!recentRoutes || !allRoutes) {
                bookingRoutes = []
              } else {
                let allRoutesById = _.keyBy(allRoutes, 'id');
                bookingRoutes = recentRoutes.map((recentRoute) => {
                  return _.assign({
                    alightStopStopId: recentRoute.alightStopStopId,
                    boardStopStopId: recentRoute.boardStopStopId
                  }, allRoutesById[recentRoute.id]);
                // Clean out "junk" routes which may be old/obsolete
                }).filter( (route)=> route && route.id !== undefined);
              }

              // activated crowdstart route
              let bookingRouteIds = _.map(bookingRoutes, route => route.id)
              activatedCrowdstartRoutes = _.filter(RoutesService.getActivatedKickstarterRoutes(), (route) => {
                return bookingRouteIds.includes(route.id)
              })

              // lite routes
              if (!liteRoutes || !subscribed) {
                subscribedLiteRoutes = []
              } else {
                liteRoutes = Object.values(liteRoutes);

                let myLiteRoutes = _.filter(liteRoutes, (route) => {
                  return !!subscribed.includes(route.label)
                })
                // Sort by label and publish
                subscribedLiteRoutes = _.sortBy(myLiteRoutes, route => {
                  return parseInt(route.label.slice(1));
                });
              }

              // merge bookingRoutes + activatedCrowdstartRoutes + liteRoutes
              routes = bookingRoutes.concat(activatedCrowdstartRoutes).concat(subscribedLiteRoutes)
              return resolve(routes)
            })
        }
      })
    }

    return {load: () => retrieve()}
  }]
)
