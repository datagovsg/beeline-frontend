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

// Parse out the available regions from the routes
// Filter what is displayed by the region filter
// Split the routes into those the user has recently booked and the rest
export default function($scope, $state, UserService, RoutesService, $q,
  BookingService, $ionicScrollDelegate, LiteRoutesService, $ionicPopup, LiteRouteSubscriptionService) {

  // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  $scope.data = {
    regions: [],
    routes: [],
    recentRoutes: [],
    selectedRegionId: undefined,
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
      $scope.data.liteRoutes = allLiteRoutes;
      console.log(allLiteRoutes)
    })

    var allRoutesPromise = RoutesService.getRoutes(ignoreCache);
    var recentRoutesPromise = RoutesService.getRecentRoutes(ignoreCache);

    // Configure the list of available regions
    allRoutesPromise.then(function(allRoutes) {
      $scope.data.regions = getUniqueRegionsFromRoutes(allRoutes);
      // Need to sort by time of day rather than by absolute time,
      // in case we have routes with missing dates (e.g. upcoming routes)
      $scope.data.routes = _.sortBy(allRoutes, (route) => {
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
  $scope.$watchGroup(['data.routes',  'data.liteRoutes', 'data.selectedRegionId'], function([routes, liteRoutes, selectedRegionId]) {
    $scope.data.filteredActiveRoutes = filterRoutesByRegionId(routes, +selectedRegionId);
    $scope.data.filteredLiteRoutes = filterRoutesByRegionId(liteRoutes, +selectedRegionId);
  });

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
    (newValue) => {
      _.forEach($scope.data.liteRoutes,(liteRoute)=>{
        if (newValue.includes(liteRoute.label)) {
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
    (newUser, oldUser) => {
      $scope.refreshRoutes(!firstRun);
      firstRun = false;
    });

}
