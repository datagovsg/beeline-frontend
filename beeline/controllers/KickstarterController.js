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
    console.log(userBids);
    $scope.userBids = userBids;
    $scope.recentBids = $scope.userBids.map((bid)=>{
      return {routeId: bid.id,
              boardStopId: bid.bid.tickets[0].boardStop.stopId,
              alightStopId: bid.bid.tickets[0].alightStop.stopId,
              bidPrice: bid.bid.userOptions.price}});
    $scope.recentBidsById = _.keyBy($scope.recentBids, r=>r.routeId);
    var recentBidRouteIds = _.keys($scope.recentBidsById);
    var recentAndAvailable = _.partition($scope.data.kickstarter, (x)=>{
      return _.includes(recentBidRouteIds, x.id.toString());
    });
    //TODO: user delete bid from summary need to update this list
    $scope.data.backedKickstarter = recentAndAvailable[0];
    $scope.data.kickstarter = recentAndAvailable[1];
  })

}
