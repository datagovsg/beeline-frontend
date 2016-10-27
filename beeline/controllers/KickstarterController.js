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

  $scope.refreshRoutes = function (ignoreCache) {

    // var kickstarterPromise = RoutesService.getKickstarterRoutes(ignoreCache);
    var kickstarterPromise = KickstarterService.getLelong(ignoreCache);

    // Configure the list of available regions
    kickstarterPromise.then(function(allRoutes) {
      $scope.data.kickstarter = _.sortBy(allRoutes, 'label');
      $scope.error = null;
    })
    .catch(() => {
      $scope.error = true;
    })
    .then(() => {
      $scope.$broadcast('scroll.refreshComplete');
    });
  }

  // Don't override the caching in main.js
  // var firstRun = true;
  $scope.$watch(() => UserService.getUser() && UserService.getUser().id,
    async () => {
       $scope.refreshRoutes(/*!firstRun*/);
       var user = UserService.getUser();
       $scope.isLoggedIn = user ? true : false;
       $scope.user = user;
       $scope.userBids = await KickstarterService.getBids(true);
       console.log($scope.userBids);
       if ($scope.userBids) {
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
      }
      // firstRun = false;
  })

}
