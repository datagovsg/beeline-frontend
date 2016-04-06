import {formatHHMM_ampm} from '../shared/format';
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

export default function ($scope, $state, Routes) {

  $scope.data = {} // Create a scope sub-object cos angular is dumb
                   // https://github.com/angular/angular.js/wiki/Understanding-Scopes

  Routes.getRoutes().then(function(routes){
    $scope.data.regions = getUniqueRegionsFromRoutes(routes);
    $scope.$watch('data.selectedRegionId', function(newSelectedRegionId, oldSelectedRegionId){
      $scope.data.activeRoutes = filterRoutesByRegionId(routes, +newSelectedRegionId);
      console.log($scope.data.activeRoutes);
    });
  });

};