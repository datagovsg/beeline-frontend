import _ from 'lodash';
import shareReferralModalTemplate from '../templates/share-referral-modal.html';

// Parse out the available regions from the routes
// Filter what is displayed by the region filter
// Split the routes into those the user has recently booked and the rest
export default function(
  $scope, 
  $state, 
  UserService, 
  RoutesService, 
  $q,
  BookingService, 
  $ionicScrollDelegate, 
  LiteRoutesService, 
  $ionicPopup,
  LiteRouteSubscriptionService, 
  $timeout, 
  SearchService, 
  $ionicModal, 
  $interval,
  $cordovaSocialSharing
) {

  // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  $scope.data = {
    placeFilter: null,
    // The different types of routes in the results
    activatedKickstarterRoutes: [],
    recentRoutes: [],
    liteRoutes: [],
    routes: [],
    crowdstartRoutes: [],
    // ???
    nextSessionId: null
  };

  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------
  $scope.setPlaceFilter = (place) => { 
    $scope.data.placeFilter = place; 
  };

  // Manually pull the newest data from the server
  // Report any errors that happen
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
    })
    .catch(() => {
      $scope.error = true;
    })
  };

  // ---------------------------------------------------------------------------
  // Watchers
  // ---------------------------------------------------------------------------
  // Kickstarted routes
  $scope.$watchGroup(
    [
      () => RoutesService.getActivatedKickstarterRoutes(),
      'data.placeFilter'
    ],
    ([routes, placeFilter]) => { 
      if (!routes) return;
      if (placeFilter) {
        routes = SearchService.filterRoutesByPlace(routes, placeFilter);
      }
      $scope.data.activatedKickstarterRoutes = routes;
    }
  );

  // Recent routes
  // Need to pull in the "full" data from all routes
  $scope.$watchGroup(
    [
      RoutesService.getRecentRoutes(),
      RoutesService.getRoutesWithRoutePass(),
      'data.placeFilter'
    ], 
    ([
      recentRoutes, 
      allRoutes,
      placeFilter
    ]) => {
      if (!allRoutes) return;
      if (placeFilter) {
        allRoutes = SearchService.filterRoutesByPlace(allRoutes, placeFilter);
      }
      if(recentRoutes && allRoutes) {
        let allRoutesById = _.keyBy(allRoutes, 'id')
        $scope.data.recentRoutes = recentRoutes.map(r => {
          _.assign({
            alightStopStopId: r.alightStopStopId,
            boardStopStopId: r.boardStopStopId
          }, allRoutesById[r.id]);
        }).filter(r => r.id !== undefined);
      }
    }
  );

  // Lite routes - doing this interval hack because promises are hard  
  // Mark which lite routes are subscribed
  $interval(() => {
    LiteRoutesService.getLiteRoutes().then((liteRoutes) => {
      if (!liteRoutes) return;
      if ($scope.data.placeFilter) { 
        liteRoutes = SearchService.filterRoutesByPlace(
          Object.values(liteRoutes), 
          $scope.data.placeFilter
        );
      }
      var subscribed = LiteRouteSubscriptionService.getSubscriptionSummary();
      _.forEach(liteRoutes, (liteRoute) => {
        liteRoute.isSubscribed = !!subscribed.includes(liteRoute.label);
      });
      $scope.data.liteRoutes = liteRoutes;
    });
  }, 3000)

  // Normal routes
  // Sort them by start time
  $scope.$watchGroup(
    [
      () => RoutesService.getRoutesWithRoutePass(),
      "data.placeFilter"
    ], 
    ([allRoutes, placeFilter]) => {
      // Sort the routes by the time of day
      if (!allRoutes) return;
      if (placeFilter) {
        allRoutes = SearchService.filterRoutesByPlace(allRoutes, placeFilter);
      }
      $scope.data.routes = _.sortBy(allRoutes, 'label', (route) => {
        var firstTripStop = _.get(route, 'trips[0].tripStops[0]');
        var midnightOfTrip = new Date(firstTripStop.time.getTime());
        midnightOfTrip.setHours(0,0,0,0);
        return firstTripStop.time.getTime() - midnightOfTrip.getTime();
      });
    }
  );

  // ---------------------------------------------------------------------------
  // Misc
  // ---------------------------------------------------------------------------

  // Session ID cache for some reason?
  $scope.$on('$ionicView.beforeEnter', () => {
    $scope.data.nextSessionId = BookingService.newSession();
  })

  // Manually resize the thing when routes change
  $scope.$watchGroup(
    [
      'data.recentRoutes', 
      'data.liteRoutes',
      'data.routes',
      'data.crowdstartRoutes'
    ],
    () => $ionicScrollDelegate.resize()
  );
}
