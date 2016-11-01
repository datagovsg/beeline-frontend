import _ from 'lodash';

// Return an array of regions covered by a given array of routes
function getUniqueRegionsFromRoutes(routes) {
  return _(routes).map(function(route) {return route.regions;})
  .flatten()
  .uniqBy('id')
  .sortBy('name')
  .value();
}

// Returns a new array with routes matching the given regionId
// If regionId is undefined then returns a new array with all the same routes
function filterRoutesByRegionId(routes, regionId) {
  return _.filter(routes, function(route) {
    if (regionId) return _.some(route.regions, {'id': regionId});
    else return true;
  });
}
function filterRoutesByText(routes, string) {
  return routes.filter(route => routeContainsString(route, string));
}
function filterRoutes(routes, regionId, string) {
  return filterRoutesByText(filterRoutesByRegionId(routes, regionId), string)
}

// Input: a Route and a string
// Output: True if route metatdata contains the string
function routeContainsString(route, string) {
  if (!string) return true;

  function contains(s, t) {
    if (typeof s == 'string') {
      return s.toUpperCase().includes(t.toUpperCase())
    } else {
      return false;
    }
  }
  return contains(route.name, string) ||
    contains(route.notes && route.notes.description, string) ||
    contains(route.schedule, string) ||
    contains(route.label, string) ||
    (route.trips[0] && route.trips[0].tripStops.some(ts => contains(ts.stop.description, string))) ||
    route.regions.some(region => contains(region.name, string));
}

// Parse out the available regions from the routes
// Filter what is displayed by the region filter
// Split the routes into those the user has recently booked and the rest
export default function($scope, $state, UserService, RoutesService, $q,
  BookingService, $ionicScrollDelegate, LiteRoutesService, $ionicPopup,
  LiteRouteSubscriptionService, $timeout) {

  // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  $scope.data = {
    regions: [],
    routes: [],
    recentRoutes: [],
    selectedRegionId: undefined,
    filterText: '',
    stagingFilterText: '',
    filteredActiveRoutes: [],
    filteredRecentRoutes: [],
    nextSessionId: null,
    liteRoutes: [],
    filteredLiteRoutes: [],
  };

  $scope.$on('$ionicView.beforeEnter', () => {
    $scope.data.nextSessionId = BookingService.newSession();
  })

  // $scope.$watch('data.liteRoutes', updateSubscriptionStatus)
  // $scope.$watch(() => Svc.getSubscriptionSummary(), updateSubscriptionStatus)
  var allLiteRoutesPromise

  $scope.refreshRoutes = function (ignoreCache) {
    allLiteRoutesPromise = LiteRoutesService.getLiteRoutes(ignoreCache);
    // allLiteRoutesPromise.then(function(allLiteRoutes){
    //   $scope.data.liteRoutes = allLiteRoutes;
    // })
    var liteRouteSubscriptionsPromise = LiteRouteSubscriptionService.getSubscriptions(ignoreCache);
    $q.all([allLiteRoutesPromise, liteRouteSubscriptionsPromise]).then((response)=>{
      var allLiteRoutes, liteRouteSubscriptions;
      [allLiteRoutes, liteRouteSubscriptions] = response;
      $scope.data.liteRoutes = _.sortBy(allLiteRoutes, 'label');
    })

    var allRoutesPromise = RoutesService.getRoutes(ignoreCache);
    var recentRoutesPromise = RoutesService.getRecentRoutes(ignoreCache);

    // Configure the list of available regions
    allRoutesPromise.then(function(allRoutes) {
      // Need to sort by time of day rather than by absolute time,
      // in case we have routes with missing dates (e.g. upcoming routes)
      $scope.data.routes = _.sortBy(allRoutes, 'label', (route) => {
        var firstTripStop = _.get(route, 'trips[0].tripStops[0]');

        var midnightOfTrip = new Date(firstTripStop.time.getTime());
        midnightOfTrip.setHours(0,0,0,0);
        return firstTripStop.time.getTime() - midnightOfTrip.getTime();
      });
    });

    recentRoutesPromise.then(function(recentRoutes) {
      $scope.data.recentRoutes = recentRoutes;
    });

    $q.all([allRoutesPromise, recentRoutesPromise, allLiteRoutesPromise, liteRouteSubscriptionsPromise]).then(() => {
      $scope.error = null;
    })
    .catch(() => {
      $scope.error = true;
    })
    .then(() => {
      $scope.$broadcast('scroll.refreshComplete');
    })
  }

  // Filter the displayed routes by selected region
  $scope.$watchGroup(['data.routes',  'data.liteRoutes', 'data.selectedRegionId', 'data.filterText'], function([routes, liteRoutes, selectedRegionId, filterText]) {
    var normalAndLiteRoutes = routes.concat(_.values(liteRoutes));
    $scope.data.regions = getUniqueRegionsFromRoutes(normalAndLiteRoutes);
    $scope.data.filteredActiveRoutes = filterRoutes(routes, +selectedRegionId, filterText);
    $scope.data.filteredLiteRoutes = filterRoutes(liteRoutes, +selectedRegionId, filterText);
  });

  // Throttle the actual updating of filter text
  $scope.updateFilter = _.throttle((value) => {
    $timeout(() => {
      $scope.data.filterText = $scope.data.stagingFilterText;
    }, 0)
  }, 400, {trailing: true})

  // Filter the recent routes display whenever the active routes is changed
  // This cascades the region filter from the previous block
  $scope.$watchGroup(['data.filteredActiveRoutes', 'data.recentRoutes'], function([newActiveRoutes, recentRoutes]) {
    $scope.data.recentRoutesById = _.keyBy(recentRoutes, r => r.id);
    $scope.data.filteredRecentRoutes = recentRoutes.map(
      recent => newActiveRoutes.find(route => route.id === recent.id)
    ).filter(x => x) // Exclude null values (e.g. expired routes)
  });

  $scope.$watchGroup(['data.filteredRecentRoutes', 'data.filteredActiveRoutes', 'data.filteredLiteRoutes'],
    () => {
      $ionicScrollDelegate.resize();
  });

  $scope.$watchCollection(() =>
    [].concat(LiteRouteSubscriptionService.getSubscriptionSummary())
    .concat([$scope.data.liteRoutes]),
    () => {
      var subscribedRoutes = LiteRouteSubscriptionService.getSubscriptionSummary();
      _.forEach($scope.data.liteRoutes,(liteRoute)=>{
        if (subscribedRoutes.includes(liteRoute.label)) {
          liteRoute.isSubscribed = true;
        }
        else {
          liteRoute.isSubscribed = false;
        }
      })
    }
  );

  // Don't override the caching in main.js
  var firstRun = true;
  $scope.$watch(() => UserService.getUser() && UserService.getUser().id,
    () => {
      $scope.refreshRoutes(!firstRun);
      firstRun = false;
    });

}
