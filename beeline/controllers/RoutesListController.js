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
  Promise.all([
    RoutesService.getRoutes(),
    RoutesService.getRecentRoutes()
  ]).then(function(results) {
    var allRoutes = results[0];
    var recentRoutes = results[1];
    $scope.data.regions = getUniqueRegionsFromRoutes(allRoutes);
    $scope.$watch('data.selectedRegionId', function(newRegionId) {
      var regionRoutes = filterRoutesByRegionId(allRoutes, +newRegionId);
      $scope.data.recentActiveRoutes = _.filter(regionRoutes, function(route) {
        return _.some(recentRoutes, {'id': route.id });
      });
      $scope.data.remainingActiveRoutes = _.reject(regionRoutes, function(route) {
        return _.some(recentRoutes, {'id': route.id });
      });
    });
  });
};