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
  $ionicScrollDelegate, $ionicPopup,) {

  // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  $scope.data = {
    regions: [],
    kickstart: [],
    selectedRegionId: undefined,
    filteredKickstart: [],
  };

  $scope.refreshRoutes = function (ignoreCache) {

    var kickstartPromise = RoutesService.getKickstartRoutes(ignoreCache);

    // Configure the list of available regions
    kickstartPromise.then(function(allRoutes) {
      // Need to sort by time of day rather than by absolute time,
      // in case we have routes with missing dates (e.g. upcoming routes)
      $scope.data.kickstart = _.sortBy(allRoutes, 'label', (route) => {
        var firstTripStop = _.get(route, 'trips[0].tripStops[0]');

        var midnightOfTrip = new Date(firstTripStop.time.getTime());
        midnightOfTrip.setHours(0,0,0,0);
        return firstTripStop.time.getTime() - midnightOfTrip.getTime();
      });

      $scope.error = null;
    })
    .catch(() => {
      $scope.error = true;
    })
    .then(() => {
      $scope.$broadcast('scroll.refreshComplete');
    });
  }

  // Filter the displayed routes by selected region
  $scope.$watchGroup(['data.kickstart', 'data.selectedRegionId'], function([routes, selectedRegionId]) {
    $scope.data.regions = getUniqueRegionsFromRoutes(routes);
    $scope.data.filteredKickstart = filterRoutesByRegionId(routes, +selectedRegionId);
    $ionicScrollDelegate.resize();
  });

  // Don't override the caching in main.js
  var firstRun = true;
  $scope.$watch(() => UserService.getUser() && UserService.getUser().id,
    () => {
      $scope.refreshRoutes(!firstRun);
      firstRun = false;
    });

  $scope.createBid = function(id){
    if (!UserService.getUser()) {
      console.log("You need to login");
    }
    else {
      console.log("I'm bidding");
    }
  }

}
