import _ from 'lodash';
import loadingTemplate from '../templates/loading.html';

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
  $ionicScrollDelegate, $ionicPopup, KickstarterService, $ionicLoading) {

  // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  $scope.data = {
    kickstarter: [],
    backedKickstarter: [],
    regions: [],
  };

  $scope.refreshRoutes = function() {
    try {
      KickstarterService.fetchLelong(true);
      KickstarterService.fetchBids(true);
      $scope.error = null;
    } catch(error) {
      $scope.error = true;
    } finally {
      $scope.$broadcast('scroll.refreshComplete');
    }
  }

  //show loading spinner for the 1st time
  $scope.$watch(()=>KickstarterService.getLelong(), (lelongRoutes)=>{
    if (lelongRoutes.length==0) {
      $ionicLoading.show({
        template: loadingTemplate
      })
    } else {
      $ionicLoading.hide();
    }
  });

  $scope.$watchGroup([()=>KickstarterService.getLelong(), ()=>KickstarterService.getBids(),'data.selectedRegionId'],
    ([lelongRoutes, userBids, selectedRegionId])=>{
      if (lelongRoutes.length==0) return;
      $scope.data.kickstarter = _.sortBy(lelongRoutes, 'label');
      $scope.data.regions = getUniqueRegionsFromRoutes($scope.data.kickstarter);
      $scope.data.filteredkickstarter = filterRoutesByRegionId($scope.data.kickstarter, +selectedRegionId);
      if (!userBids)  return;
      $scope.userBids = userBids;
      $scope.recentBidsById = _.keyBy($scope.userBids, r=>r.routeId);
      var recentAndAvailable = _.partition($scope.data.kickstarter, (x)=>{
        return _.includes(_.keys($scope.recentBidsById), x.id.toString());
      });
      $scope.data.backedKickstarter = recentAndAvailable[0];
      //don't display it in kickstarter if it's 7 days after expiry
      $scope.data.kickstarter = recentAndAvailable[1].filter((route)=>!route.is7DaysOld);
      $scope.data.filteredkickstarter = filterRoutesByRegionId($scope.data.kickstarter, +selectedRegionId);
      $scope.data.filteredbackedKickstarter = filterRoutesByRegionId($scope.data.backedKickstarter, +selectedRegionId);
  })

}
