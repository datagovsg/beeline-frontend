import _ from 'lodash';

// Return an array of regions covered by a given array of routes
function getUniqueRegionsFromRoutes(routes){
  return _(routes).map(function(route){return route.regions;})
  .flatten()
  .uniqBy('id')
  .sortBy('name')
  .value();
};

// Returns a new array with routes matching the given regionId
// If regionId is undefined then returns a new array with all the same routes
function filterRoutesByRegionId(routes, regionId){
  return _.filter(routes, function(route) {
    if (regionId) return _.some(route.regions, {'id': regionId });
    else return true
  });
}

// Parse out the available regions from the routes
// Filter what is displayed by the region filter
// Split the routes into those the user has recently booked and the rest
export default function ($scope, $state, RoutesService) {
  
  $scope.data = {} // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  var allRoutesPromise = RoutesService.getRoutes();
  var recentRoutesPromise = RoutesService.getRecentRoutes();

  // Configure the list of available regions
  allRoutesPromise.then(function(allRoutes) {
    $scope.data.regions = getUniqueRegionsFromRoutes(allRoutes);
  });

  // Filter the displayed routes by selected region
  allRoutesPromise.then(function(allRoutes) {
    $scope.$watch('data.selectedRegionId', function(newRegionId) {
      $scope.data.filteredActiveRoutes = filterRoutesByRegionId(allRoutes, +newRegionId);
    });
  });

  // Filter the recent routes display whenever the active routes is changed
  // This cascades the region filter from the previous block
  recentRoutesPromise.then(function(recentRoutes) {
    $scope.$watch('data.filteredActiveRoutes', function(newActiveRoutes) {
      $scope.data.filteredRecentRoutes = _.filter(newActiveRoutes, function(route) {
        return _.some(recentRoutes, {'id': route.id });
      });
    });
  });

};