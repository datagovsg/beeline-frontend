import _ from 'lodash';

// Parse out the available regions from the routes
// Filter what is displayed by the region filter
// Split the routes into those the user has recently booked and the rest
export default function($scope, $state, UserService, RoutesService, $q,
  $ionicScrollDelegate, $ionicPopup, KickstarterService) {

  // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  $scope.data = {
    kickstarter: [],
    backedKickstarter: []
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

  $scope.$watchGroup([()=>KickstarterService.getLelong(), ()=>KickstarterService.getBids()],([lelongRoutes, userBids])=>{
    if (!lelongRoutes) return;
    $scope.data.kickstarter = _.sortBy(lelongRoutes, 'label');
    if (!userBids)  return;
    $scope.userBids = userBids;
    $scope.recentBidsById = _.keyBy($scope.userBids, r=>r.routeId);
    var recentAndAvailable = _.partition($scope.data.kickstarter, (x)=>{
      return _.includes(_.keys($scope.recentBidsById), x.id.toString());
    });
    $scope.data.backedKickstarter = recentAndAvailable[0];
    $scope.data.kickstarter = recentAndAvailable[1];
  })

}
