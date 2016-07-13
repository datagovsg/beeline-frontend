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
  BookingService) {

  // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  $scope.data = {
    regions: [],
    routes: [],
    recentRoutes: [],
    selectedRegionId: undefined,
    filteredActiveRoutes: [],
    filteredRecentRoutes: [],
    nextSessionId: null,
  };

  $scope.$on('$ionicView.afterEnter', () => {
    $scope.data.nextSessionId = BookingService.newSession();
  })

  $scope.refreshRoutes = function (ignoreCache) {
    var allRoutesPromise = RoutesService.getRoutes(ignoreCache);
    var recentRoutesPromise = RoutesService.getRecentRoutes(ignoreCache);

    // Configure the list of available regions
    allRoutesPromise.then(function(allRoutes) {
      $scope.data.regions = getUniqueRegionsFromRoutes(allRoutes);
      $scope.data.routes = allRoutes;
    });

    recentRoutesPromise.then(function(recentRoutes) {
      $scope.data.recentRoutes = recentRoutes;
    });

    $q.all([allRoutesPromise, recentRoutesPromise]).then(() => {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.error = null;
    })
    .catch(() => {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.error = true;
    })
  }

  // Filter the displayed routes by selected region
  $scope.$watchGroup(['data.routes', 'data.selectedRegionId'], function([routes, selectedRegionId]) {
    $scope.data.filteredActiveRoutes = filterRoutesByRegionId(routes, +selectedRegionId);
  });

  // Filter the recent routes display whenever the active routes is changed
  // This cascades the region filter from the previous block
  $scope.$watchGroup(['data.filteredActiveRoutes', 'data.recentRoutes'], function([newActiveRoutes, recentRoutes]) {
    $scope.data.recentRoutesById = _.keyBy(recentRoutes, r => r.id);
    $scope.data.filteredRecentRoutes = _.filter(newActiveRoutes, function(route) {
      return _.some(recentRoutes, {'id': route.id});
    });
  });

  $scope.$watch(() => UserService.getUser(), () => $scope.refreshRoutes(true));
}
