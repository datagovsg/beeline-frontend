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
    placeQuery: null, // The place object used to search
    // Different types of route data
    activatedCrowdstartRoutes: [],
    recentRoutes: [],
    recentRoutesById: null,
    liteRoutes: [],
    routes: [],
    crowdstartRoutes: [],
    // ???
    nextSessionId: null,
    activatedCrowdstartPaths: [],
    recentPaths: [],
    litePaths: [],
    paths: [], // This should be in an angular filter
    crowdstartPaths: [],
    searchCoordinates: null // This should be an angular filter too
  };

  $scope.map = MapOptions.defaultMapOptions()

  // ---------------------------------------------------------------------------
  // UI Hooks
  // ---------------------------------------------------------------------------

  // When setting the place check that it is a proper place with a geometry
  // The input sends a name only "place" object if you dont choose an option
  $scope.setPlaceQuery = (place) => { $scope.data.placeQuery = place; }
  $scope.$watch("data.placeQuery", (place) => {
    if (place && place.geometry) {
      $scope.data.searchCoordinates = {
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng()
      };
      // Need to copy so that panning doesnt change the search coordinates
      $scope.map.center = Object.create($scope.data.searchCoordinates);
    } else {
      $scope.data.searchCoordinates = null;
    }
  });

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
      if (placeQuery && placeQuery.geometry) {
        routes = SearchService.filterRoutesByPlace(routes, placeQuery);
      } else if (placeQuery && placeQuery.name) {
        routes = SearchService.filterRoutesByText(routes, placeQuery.name);
      }
      // Publish
      $scope.data.activatedCrowdstartRoutes = routes;
      // Draw the paths
      $q.all($scope.data.activatedCrowdstartRoutes)
      .then(routes => routes.map(route => route.path))
      .then(paths => {
        return Promise.all(
          paths.map(path => {
            if (path) return RoutesService.decodeRoutePath(path);
            else return [];
          })
        );
      })
      .then(decodedPaths => {
        $scope.data.activatedCrowdstartPaths = decodedPaths
      });
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

      // Filter the routes depending on existence of object or text
      if (placeQuery && placeQuery.geometry) {
        allRoutes = SearchService.filterRoutesByPlace(allRoutes, placeQuery);
      } else if (placeQuery && placeQuery.name) {
        allRoutes = SearchService.filterRoutesByText(
          allRoutes, 
          placeQuery.name
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
      // Draw the paths
      $q.all($scope.data.recentRoutes)
      .then(routes => routes.map(route => route.path))
      .then(paths => {
        return Promise.all(
          paths.map(path => {
            if (path) return RoutesService.decodeRoutePath(path);
            else return [];
          })
        );
      })
      .then(decodedPaths => $scope.data.recentPaths = decodedPaths);
    }
  );

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
      if ($scope.data.placeQuery && $scope.data.placeQuery.geometry) {
        liteRoutes = SearchService.filterRoutesByPlace(
          liteRoutes,
          $scope.data.placeQuery
        );
      } else if ($scope.data.placeQuery && $scope.data.placeQuery.name) {
        liteRoutes = SearchService.filterRoutesByText(
          liteRoutes,
          $scope.data.placeQuery.name
        );
     }
     // Add the subscription information
      _.forEach(liteRoutes, (liteRoute) => {
        liteRoute.isSubscribed = !!subscribed.includes(liteRoute.label);
      });
      // Publish
      $scope.data.liteRoutes = liteRoutes;
      // Draw the paths
      $q.all($scope.data.liteRoutes)
      .then(routes => routes.map(route => route.path))
      .then(paths => {
        return Promise.all(
          paths.map(path => {
            if (path) return RoutesService.decodeRoutePath(path);
            else return [];
          })
        );
      })
      .then(decodedPaths => $scope.data.litePaths = decodedPaths);
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
      if (placeQuery && placeQuery.geometry) {
        allRoutes = SearchService.filterRoutesByPlace(allRoutes, placeQuery);
      } else if (placeQuery && placeQuery.name) {
        allRoutes = SearchService.filterRoutesByText(
          allRoutes, 
          placeQuery.name
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
      $q.all($scope.data.routes)
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
    [() => KickstarterService.getLelong(), 'data.placeQuery'],
    ([routes, placeQuery]) => {
      if (!routes) routes = [];
      // Filter the routes
      if (placeQuery && placeQuery.geometry) { 
        routes = SearchService.filterRoutesByPlace(routes, placeQuery);
      } else if (placeQuery && placeQuery.name) {
        routes = SearchService.filterRoutesByText(routes, placeQuery.name);
      }
      // Map to scope once done filtering and sorting
      $scope.data.crowdstartRoutes = _.sortBy(routes, 'label');
      // Draw the paths
      $q.all($scope.data.crowdstartRoutes)
      .then(routes => routes.map(route => route.path))
      .then(paths => {
        return Promise.all(
          paths.map(path => {
            if (path) return RoutesService.decodeRoutePath(path);
            else return [];
          })
        );
      })
      .then(decodedPaths => $scope.data.crowdstartPaths = decodedPaths);
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
