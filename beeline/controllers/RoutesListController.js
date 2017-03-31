import _ from 'lodash';

export default function(
  // Angular Tools
  $scope, 
  $q,
  $interval,
  $ionicScrollDelegate, 
  // Route Information
  RoutesService, 
  KickstarterService,
  LiteRoutesService, 
  // Meta
  LiteRouteSubscriptionService, 
  SearchService, 
  BookingService,
  MapOptions
) {

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  // Explicitly declare/initialize of scope variables we use
  $scope.data = {
    placeFilter: null, // The place object chosen from autocomplete
    placeFilterText: "", // Plain text fallback if no object is chosen
    // Different types of route data
    activatedCrowdstartRoutes: [],
    recentRoutes: [],
    liteRoutes: [],
    routes: [],
    crowdstartRoutes: [],
    // ???
    nextSessionId: null,
    paths: []
  };

  $scope.map = MapOptions.defaultMapOptions()

  // ---------------------------------------------------------------------------
  // UI Hooks
  // ---------------------------------------------------------------------------
  // When setting the place object keep the UI text in sync
  // BUG: This causes a "flicker" as the country "Singapore" or region is
  // appended to the string initially but disappears after the sync
  // there doesnt seem to be a simple way to get the "full" autocomplete string
  $scope.setPlaceFilter = (place) => { 
    if (place) {
      $scope.data.placeFilter = place;
      $scope.data.placeFilterText = place.name;
    } else {
      $scope.data.placeFilter = null;
      $scope.data.placeFilterText = "";
    }
  };

  // Consistency check to remove the place if the text is changed to something
  // else
  $scope.$watch(
    'data.placeFilterText',
    (text) => { 
      // Do nothing if the text is still valid
      if (
        $scope.data.placeFilter && 
        $scope.data.placeFilter.name === $scope.data.placeFilterText
      ) return;
      // Otherwise just the object
      $scope.data.placeFilter = null;
    }
  );

  // Manually pull the newest data from the server
  // Report any errors that happen
  // Note that theres no need to update the scope manually
  // since this is done by the service watchers
  $scope.refreshRoutes = function (ignoreCache) {
    RoutesService.fetchRouteCredits(ignoreCache);
    RoutesService.fetchRoutes(ignoreCache);
    var routesPromise = RoutesService.fetchRoutesWithRoutePass();
    var recentRoutesPromise = RoutesService.fetchRecentRoutes(ignoreCache);
    var allLiteRoutesPromise = LiteRoutesService.getLiteRoutes(ignoreCache);
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
    [
      () => RoutesService.getActivatedKickstarterRoutes(),
      'data.placeFilter',
      'data.placeFilterText'
    ],
    ([routes, placeFilter, placeFilterText]) => {
      // Input validation
      if (!routes) routes = [];
      // Filtering
      if (placeFilter) {
        routes = SearchService.filterRoutesByPlace(routes, placeFilter);
      } else {
        routes = SearchService.filterRoutesByText(routes, placeFilterText);
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
      'data.placeFilter',
      'data.placeFilterText'
    ], 
    ([recentRoutes, allRoutes, placeFilter, placeFilterText]) => {
      // If we cant find route data here then proceed with empty
      // This allows it to organically "clear" any state
      if (!recentRoutes) recentRoutes = [];
      if (!allRoutes) allRoutes = [];

      // Filter the routes depending on existence of object or text
      if (placeFilter) {
        allRoutes = SearchService.filterRoutesByPlace(allRoutes, placeFilter);
      } else {
        allRoutes = SearchService.filterRoutesByText(
          allRoutes, 
          placeFilterText
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
    }
  );

  // Lite routes - doing this interval hack because promises are hard
  // Will do it properly once we get literoutes service to be synchronous
  // Mark which lite routes are subscribed
  $interval(() => {
    LiteRoutesService.getLiteRoutes().then((liteRoutes) => {
      // Input validation
      if (!liteRoutes) liteRoutes = [];
      liteRoutes = Object.values(liteRoutes);
      // Filtering
      if ($scope.data.placeFilter) {
        liteRoutes = SearchService.filterRoutesByPlace(
          liteRoutes,
          $scope.data.placeFilter
        );
      } else {
        liteRoutes = SearchService.filterRoutesByText(
          liteRoutes,
          $scope.data.placeFilterText
        );
      }
      // Add the subscription information
      var subscribed = LiteRouteSubscriptionService.getSubscriptionSummary();
      _.forEach(liteRoutes, (liteRoute) => {
        liteRoute.isSubscribed = !!subscribed.includes(liteRoute.label);
      });
      // Publish
      $scope.data.liteRoutes = liteRoutes;
    });
  }, 2000);

  // Normal routes
  // Sort them by start time
  $scope.$watchGroup(
    [
      () => RoutesService.getRoutesWithRoutePass(),
      "data.placeFilter",
      "data.placeFilterText"
    ], 
    ([allRoutes, placeFilter, placeFilterText]) => {
      // Input validation
      if (!allRoutes) allRoutes = [];
      // Filter routes
      if (placeFilter) {
        allRoutes = SearchService.filterRoutesByPlace(allRoutes, placeFilter);
      } else {
        allRoutes = SearchService.filterRoutesByText(
          allRoutes, 
          placeFilterText
        );
      }
      // Sort the routes by the time of day
      $scope.data.routes = _.sortBy(allRoutes, 'label', (route) => {
        var firstTripStop = _.get(route, 'trips[0].tripStops[0]');
        var midnightOfTrip = new Date(firstTripStop.time.getTime());
        midnightOfTrip.setHours(0,0,0,0);
        return firstTripStop.time.getTime() - midnightOfTrip.getTime();
      });
      // Draw the paths
      let fullRoutePromises = $scope.data.routes.map(route => {
        return RoutesService.getRoute(route.id);
      });
      $q.all(fullRoutePromises)
      .then(routes => routes.map(route => route.path))
      .then(paths => {
        return Promise.all(
          paths.map(path => {
            if (path) return RoutesService.decodeRoutePath(path);
            else return [];
          })
        );
      })
      .then(decodedPaths => $scope.data.paths = decodedPaths);
    }
  );

  // Unactivated kickstarter routes
  $scope.$watchGroup(
    [
      () => KickstarterService.getLelong(),
      'data.placeFilter',
      'data.placeFilterText'
    ],
    ([routes, placeFilter, placeFilterText]) => {
      if (!routes) routes = [];
      // Filter the routes
      if (placeFilter) { 
        routes = SearchService.filterRoutesByPlace(routes, placeFilter);
      } else {
        routes = SearchService.filterRoutesByText(routes, placeFilterText);
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
