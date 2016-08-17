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
  BookingService, $ionicScrollDelegate, LiteRoutesService, $ionicPopup) {

  // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  $scope.data = {
    regions: [],
    routes: [],
    recentRoutes: [],
    selectedRegionId: undefined,
    filteredActiveRoutes: [],
    filteredRecentRoutes: [],
    nextSessionId: null,
    liteRoutes: [],
    filteredLiteRoutes: [],
  };

  $scope.$on('$ionicView.beforeEnter', () => {
    $scope.data.nextSessionId = BookingService.newSession();
  })

  $scope.refreshRoutes = function (ignoreCache) {
    var allLiteRoutesPromise = LiteRoutesService.getLiteRoutes(ignoreCache);
    allLiteRoutesPromise.then(function(allLiteRoutes){
      console.log("lite routes returns as");
      console.log(allLiteRoutes);
      $scope.data.liteRoutes = allLiteRoutes;
    })

    var allRoutesPromise = RoutesService.getRoutes(ignoreCache);
    var recentRoutesPromise = RoutesService.getRecentRoutes(ignoreCache);

    // Configure the list of available regions
    allRoutesPromise.then(function(allRoutes) {
      $scope.data.regions = getUniqueRegionsFromRoutes(allRoutes);
      // Need to sort by time of day rather than by absolute time,
      // in case we have routes with missing dates (e.g. upcoming routes)
      $scope.data.routes = _.sortBy(allRoutes, (route) => {
        var firstTripStop = _.get(route, 'trips[0].tripStops[0]');

        var midnightOfTrip = new Date(firstTripStop.time.getTime());
        midnightOfTrip.setHours(0,0,0,0);
        return firstTripStop.time.getTime() - midnightOfTrip.getTime();
      });
    });

    recentRoutesPromise.then(function(recentRoutes) {
      $scope.data.recentRoutes = recentRoutes;
    });

    $q.all([allRoutesPromise, recentRoutesPromise], allLiteRoutesPromise).then(() => {
      $scope.error = null;
    })
    .catch(() => {
      $scope.error = true;
    })
    .then(() => {
      $scope.$broadcast('scroll.refreshComplete');
    })
  }

  // Filter the displayed routes by selected region
  $scope.$watchGroup(['data.routes',  'data.liteRoutes', 'data.selectedRegionId'], function([routes, liteRoutes, selectedRegionId]) {
    $scope.data.filteredActiveRoutes = filterRoutesByRegionId(routes, +selectedRegionId);
    $scope.data.filteredLiteRoutes = filterRoutesByRegionId(liteRoutes, +selectedRegionId);
    console.log($scope.data.filteredActiveRoutes);
    console.log($scope.data.filteredLiteRoutes);
  });

  // Filter the recent routes display whenever the active routes is changed
  // This cascades the region filter from the previous block
  $scope.$watchGroup(['data.filteredActiveRoutes', 'data.recentRoutes'], function([newActiveRoutes, recentRoutes]) {
    $scope.data.recentRoutesById = _.keyBy(recentRoutes, r => r.id);
    $scope.data.filteredRecentRoutes = recentRoutes.map(
      recent => newActiveRoutes.find(route => route.id === recent.id)
    ).filter(x => x) // Exclude null values (e.g. expired routes)
  });

  $scope.$watchGroup(['data.filteredRecentRoutes', 'data.filteredActiveRoutes', 'data.filteredLiteRoutes'],
    () => {
      $ionicScrollDelegate.resize();
    });

  // Don't override the caching in main.js
  var firstRun = true;
  $scope.$watch(() => UserService.getUser(), () => {
    $scope.refreshRoutes(!firstRun);
    firstRun = false;
  });

  // Shows a confirmation dialogue asking if the user is sure they want to log out
  $scope.promptFollow = function(liteRouteId) {
    console.log("pressed");
    $ionicPopup.confirm({
      title: 'Are you sure you want to follow this lite route?',
      subTitle: "You will view the lite route tracker in tickets."
    }).then(function(response) {
      if (response) {
        try {
          LiteRoutesService.subscribeLiteRoute(liteRouteId).then(function(response)
          {
            if (response) {
              $ionicPopup.alert({
                title: 'Success',
              })
            }
            else {
              $ionicPopup.alert({
                title: 'Error subscribing lite route',
              })
            }
          })
        }
        catch(err) {
          $ionicPopup.alert({
            title: 'Error subscribing lite route ' + err,
          })
        }
      }
    });
  };
}
