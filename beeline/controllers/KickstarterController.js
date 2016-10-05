import _ from 'lodash';


var transformKickstarterData = function (kickstarterRoutes) {
  for (let kickstarter of kickstarterRoutes){
    console.log(kickstarter);
    if (kickstarter.bids.length > 0) {
     var bidsByTier = _.groupBy(kickstarter.bids, x=>x.userOptions.price);
     console.log(kickstarter.notes.tier)
      kickstarter.notes.tier.map((tier)=>{
        if (bidsByTier[tier.price]) {
          console.log(bidsByTier[tier.price]);
          console.log(bidsByTier[tier.price].length);
        }

        _.assign(tier, {no: bidsByTier[tier.price] ?  bidsByTier[tier.price].length :0})
      })
    } else {
      kickstarter.notes.tier.map((tier)=>{
        _.assign(tier, {no: 0})
      })
    }
  }
}
// Parse out the available regions from the routes
// Filter what is displayed by the region filter
// Split the routes into those the user has recently booked and the rest
export default function($scope, $state, UserService, RoutesService, $q,
  $ionicScrollDelegate, $ionicPopup, KickstarterService) {

  // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  $scope.data = {
    kickstarter: [],
  };

  $scope.refreshRoutes = function (ignoreCache) {

    // var kickstarterPromise = RoutesService.getKickstarterRoutes(ignoreCache);
    var kickstarterPromise = KickstarterService.getLelong(ignoreCache);

    // Configure the list of available regions
    kickstarterPromise.then(function(allRoutes) {
      transformKickstarterData(allRoutes);
      console.log(allRoutes);
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
  var firstRun = true;
  $scope.$watch(() => UserService.getUser() && UserService.getUser().id,
    async () => {
       $scope.refreshRoutes(!firstRun);
       var user = UserService.getUser();
       $scope.isLoggedIn = user ? true : false;
       $scope.user = user;
       $scope.userBids = await KickstarterService.getBids(!firstRun);
       console.log($scope.userBids);
       if ($scope.userBids) {
         $scope.recentBids = $scope.userBids.map((bid)=>{
           return {routeId: bid.id,
                   boardStopId: bid.bid.tickets[0].boardStop.stopId,
                   alightStopId: bid.bid.tickets[0].alightStop.stopId,
                   bidPrice: bid.bid.userOptions.price}});
         $scope.recentBidsById = _.keyBy($scope.recentBids, r=>r.routeId);
         console.log($scope.recentBids);
         console.log($scope.recentBidsById);
       }
      firstRun = false;
    })

}
