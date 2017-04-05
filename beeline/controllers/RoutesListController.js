import _ from 'lodash';

export default function(
  // Angular Tools
  $scope,
  $q,
  // Route Information
  RoutesService,
  KickstarterService,
  LiteRoutesService, 
  // Misc
  LiteRouteSubscriptionService, 
  SearchService, 
  BookingService
) {

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  // Explicitly declare/initialize of scope variables we use
  $scope.data = {
    placeQuery: null, // The place object used to search
    queryText: "", // The actual text in the box used only for the clear button 
    // Different types of route data
    activatedCrowdstartRoutes: [],
    recentRoutes: [],
    recentRoutesById: null,
    liteRoutes: [],
    routes: [],
    crowdstartRoutes: [],
    // ???
    nextSessionId: null,
  };

  // ---------------------------------------------------------------------------
  // UI Hooks
  // ---------------------------------------------------------------------------

  // When setting the place check that it is a proper place with a geometry
  // The input sends a name only "place" object if you dont choose an option
  $scope.setPlaceQuery = (place) => { $scope.data.placeQuery = place; }

  // Manually pull the newest data from the server
  // Report any errors that happen
  // Note that theres no need to update the scope manually
  // since this is done by the service watchers
  $scope.refreshRoutes = function (ignoreCache) {
    RoutesService.fetchRouteCredits(ignoreCache);
    RoutesService.fetchRoutes(ignoreCache);
    var routesPromise = RoutesService.fetchRoutesWithRoutePass();
    var recentRoutesPromise = RoutesService.fetchRecentRoutes(ignoreCache);
    var allLiteRoutesPromise = LiteRoutesService.fetchLiteRoutes(ignoreCache);
    var liteRouteSubscriptionsPromise = LiteRouteSubscriptionService.getSubscriptions(ignoreCache);
    $q.all([
      routesPromise,
      recentRoutesPromise,
      allLiteRoutesPromise,
      liteRouteSubscriptionsPromise
    ]).then(() => {
      $scope.error = null;
    }).catch(() => {
      $scope.error = true;
    });
  };

  // ---------------------------------------------------------------------------
  // Model Hooks
  // ---------------------------------------------------------------------------
  // Kickstarted routes
  $scope.$watchGroup(
    [() => RoutesService.getActivatedKickstarterRoutes(), 'data.placeQuery'],
    ([routes, placeQuery]) => {
      // Input validation
      if (!routes) routes = [];
      // Filtering
      if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
        routes = SearchService.filterRoutesByPlaceAndText(
          routes, placeQuery, placeQuery.queryText
        );
      } else if (placeQuery && placeQuery.queryText) {
        routes = SearchService.filterRoutesByText(
          routes, placeQuery.queryText
        );
      }
      // Publish
      $scope.data.activatedCrowdstartRoutes = routes;
    }
  );

  // Recent routes
  // Need to pull in the "full" data from all routes
  $scope.$watchGroup(
    [
      () => RoutesService.getRecentRoutes(),
      () => RoutesService.getRoutesWithRoutePass(),
      'data.placeQuery'
    ], 
    ([recentRoutes, allRoutes, placeQuery]) => {
      // If we cant find route data here then proceed with empty
      // This allows it to organically "clear" any state
      if (!recentRoutes) recentRoutes = [];
      if (!allRoutes) allRoutes = [];
      // Filtering
      if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
        allRoutes = SearchService.filterRoutesByPlaceAndText(
          allRoutes, placeQuery, placeQuery.queryText
        );
      } else if (placeQuery && placeQuery.queryText) {
        allRoutes = SearchService.filterRoutesByText(
          allRoutes, placeQuery.queryText
        );
      }
      // "Fill in" the recent routes with the all routes data
      let allRoutesById = _.keyBy(allRoutes, 'id');
      $scope.data.recentRoutes = recentRoutes.map( (recentRoute) => {
        return _.assign({
          alightStopStopId: recentRoute.alightStopStopId,
          boardStopStopId: recentRoute.boardStopStopId
        }, allRoutesById[recentRoute.id]);
      // Clean out "junk" routes which may be old/obsolete
      }).filter( (route)=> route && route.id !== undefined);
      $scope.data.recentRoutesById = _.keyBy($scope.data.recentRoutes,'id');
    }
  );

  // Lite routes
  $scope.$watchGroup(
    [
      () => LiteRoutesService.getLiteRoutes(),
      () => LiteRouteSubscriptionService.getSubscriptionSummary(),
      'data.placeQuery'
    ],
    ([liteRoutes, subscribed, placeQuery]) =>{
      // Input validation
      if (!liteRoutes) liteRoutes = [];
      liteRoutes = Object.values(liteRoutes);
      // Filtering
      if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
        liteRoutes = SearchService.filterRoutesByPlaceAndText(
          liteRoutes, placeQuery, placeQuery.queryText
        );
      } else if (placeQuery && placeQuery.queryText) {
        liteRoutes = SearchService.filterRoutesByText(
          liteRoutes, placeQuery.queryText
        );
      }
     // Add the subscription information
      _.forEach(liteRoutes, (liteRoute) => {
        liteRoute.isSubscribed = !!subscribed.includes(liteRoute.label);
      });
      // Publish
      $scope.data.liteRoutes = liteRoutes;
    }
  )

  // Normal routes
  // Sort them by start time
  $scope.$watchGroup(
    [() => RoutesService.getRoutesWithRoutePass(), "data.placeQuery"],
    ([allRoutes, placeQuery]) => {
      // Input validation
      if (!allRoutes) allRoutes = [];
      // Filter routes
      if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
        allRoutes = SearchService.filterRoutesByPlaceAndText(
          allRoutes, placeQuery, placeQuery.queryText
        );
      } else if (placeQuery && placeQuery.queryText) {
        allRoutes = SearchService.filterRoutesByText(
          allRoutes, 
          placeQuery.queryText
        );
      }
      // Sort the routes by the time of day
      $scope.data.routes = _.sortBy(allRoutes, 'label', (route) => {
        var firstTripStop = _.get(route, 'trips[0].tripStops[0]');
        var midnightOfTrip = new Date(firstTripStop.time.getTime());
        midnightOfTrip.setHours(0,0,0,0);
        return firstTripStop.time.getTime() - midnightOfTrip.getTime();
      });
    }
  );

  // Unactivated kickstarter routes
  $scope.$watchGroup(
    [() => KickstarterService.getLelong(), 'data.placeQuery'],
    ([routes, placeQuery]) => {
      if (!routes) routes = [];
      // Filter the routes
      if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
        routes = SearchService.filterRoutesByPlaceAndText(
          routes, placeQuery, placeQuery.queryText
        );
      } else if (placeQuery && placeQuery.name) {
        routes = SearchService.filterRoutesByText(
          routes, placeQuery.queryText
        );
      }
      // Map to scope once done filtering and sorting
      $scope.data.crowdstartRoutes = _.sortBy(routes, 'label');
    }
  );


  // ---------------------------------------------------------------------------
  // Misc
  // ---------------------------------------------------------------------------

  // Session ID cache for some reason?
  // let ionic to clear page cache if user goes through booking process of the
  // same route few times, always start with clean form (pre-chosen stops etc.
  // are cleared),this is the internal mechanism of ionic (as any part of query
  // string change, the cache are cleared)
  $scope.$on('$ionicView.beforeEnter', () => {
    $scope.data.nextSessionId = BookingService.newSession();
  })

}
