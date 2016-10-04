import _ from 'lodash';

// Parse out the available regions from the routes
// Filter what is displayed by the region filter
// Split the routes into those the user has recently booked and the rest
export default function($scope, $state, UserService, RoutesService, $q,
  $ionicScrollDelegate, $ionicPopup, KickstarterService) {

  // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  $scope.data = {
    regions: [],
    kickstarter: [],
    selectedRegionId: undefined,
    filteredKickstarter: [],
  };

  $scope.refreshRoutes = function (ignoreCache) {

    // var kickstarterPromise = RoutesService.getKickstarterRoutes(ignoreCache);
    var kickstarterPromise = KickstarterService.getLelong(ignoreCache);

    // Configure the list of available regions
    kickstarterPromise.then(function(allRoutes) {
      // Need to sort by time of day rather than by absolute time,
      // in case we have routes with missing dates (e.g. upcoming routes)
      $scope.data.kickstarter = _.sortBy(allRoutes, 'label', (route) => {
        var firstTripStop = _.get(route, 'trips[0].tripStops[0]');

        var midnightOfTrip = new Date(firstTripStop.time);
        midnightOfTrip.setHours(0,0,0,0);
        return new Date(firstTripStop.time).getTime() - midnightOfTrip.getTime();
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

  // Don't override the caching in main.js
  var firstRun = true;
  $scope.$watch(() => UserService.getUser() && UserService.getUser().id,
    () => {
      $scope.refreshRoutes(!firstRun);
      firstRun = false;
    });

}
