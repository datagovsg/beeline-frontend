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
    // Use the place filter if we have one
    // otherwise fall back to normal text filtering
    placeFilterText: "", // The text in the input box 
    placeFilter: null, // The place object chosen from autocomplete
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
  // UI Hooks
  // ---------------------------------------------------------------------------

  // When setting the place object keep the UI text in sync
  $scope.setPlaceFilter = (place) => { 
    if (place) {
      $scope.data.placeFilter = place;
      $scope.data.placeFilterText = place.name;
    }
    else {
      $scope.data.placeFilter = null;
      $scope.data.placeFilterText = "";
    }
  };

  // If the text is changed without selecting a place, then remove the place
  $scope.$watch(
    'data.placeFilterText',
    (text) => { 
      if (
        $scope.data.placeFilter && 
        $scope.data.placeFilter.name === $scope.data.placeFilterText
      ) return;
      $scope.data.placeFilter = null;
    }
  );

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
  // Data Watchers
  // ---------------------------------------------------------------------------
  // Kickstarted routes
  $scope.$watchGroup(
    [
      () => RoutesService.getActivatedKickstarterRoutes(),
      'data.placeFilter',
      'data.placeFilterText'
    ],
    ([
      routes, 
      placeFilter, 
      placeFilterText
    ]) => { 
      if (!routes) return;
      if (placeFilter) {
        routes = SearchService.filterRoutesByPlace(routes, placeFilter);
      }
      else {
        routes = SearchService.filterRoutesByText(routes, placeFilterText);
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
      'data.placeFilter',
      'data.placeFilterText'
    ], 
    ([
      recentRoutes, 
      allRoutes,
      placeFilter,
      placeFilterText
    ]) => {
      if (!allRoutes) return;
      if (placeFilter) {
        allRoutes = SearchService.filterRoutesByPlace(allRoutes, placeFilter);
      } else {
        allRoutes = SearchService.filterRoutesByText(
          allRoutes, 
          placeFilterText
        );
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
      liteRoutes = Object.values(liteRoutes);
      if ($scope.data.placeFilter) { 
        liteRoutes = SearchService.filterRoutesByPlace(
          liteRoutes, 
          $scope.data.placeFilter
        );
      }
      else {
        liteRoutes = SearchService.filterRoutesByText(
          liteRoutes,
          $scope.data.placeFilterText
        );
      }
      var subscribed = LiteRouteSubscriptionService.getSubscriptionSummary();
      _.forEach(liteRoutes, (liteRoute) => {
        liteRoute.isSubscribed = !!subscribed.includes(liteRoute.label);
      });
      $scope.data.liteRoutes = liteRoutes;
    });
  }, 2000)

  // Normal routes
  // Sort them by start time
  $scope.$watchGroup(
    [
      () => RoutesService.getRoutesWithRoutePass(),
      "data.placeFilter",
      "data.placeFilterText"
    ], 
    ([allRoutes, placeFilter, placeFilterText]) => {
      // Sort the routes by the time of day
      if (!allRoutes) return;
      if (placeFilter) {
        allRoutes = SearchService.filterRoutesByPlace(allRoutes, placeFilter);
      }
      else {
        allRoutes = SearchService.filterRoutesByText(
          allRoutes, 
          placeFilterText
        );
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
  // let ionic to clear page cache if user goes through booking process of the 
  // same route few times, always start with clean form (pre-chosen stops etc.
  // are cleared),this is the internal mechanism of ionic (as any part of query 
  // string change, the cache are cleared)
  $scope.$on('$ionicView.beforeEnter', () => {
    $scope.data.nextSessionId = BookingService.newSession();
  })

}
