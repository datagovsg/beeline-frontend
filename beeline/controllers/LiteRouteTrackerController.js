import _ from 'lodash';
import assert from 'assert';

export default [
  '$scope', '$rootScope', '$state', '$stateParams', '$timeout', 'uiGmapGoogleMapApi',
  'CompanyService', 'TripService', 'UserService', 'MapOptions', 'RoutesService',
  'LiteRoutesService', '$ionicPopup', '$ionicLoading', 'loadingSpinner',
  function(
    $scope,  $rootScope, $state, $stateParams,  $timeout,  uiGmapGoogleMapApi,
    CompanyService, TripService,  UserService, MapOptions, RoutesService,
    LiteRoutesService,  $ionicPopup, $ionicLoading, loadingSpinner,
  ) {
    // Initialize the necessary basic data data
    $scope.user = UserService.getUser();
    $scope.map = MapOptions.defaultMapOptions({
      lines: {
        route: { path: [] },
      },
    });

    $scope.disp = {}

    $scope.liteRouteLabel = $stateParams.liteRouteLabel;

    var routePromise = LiteRoutesService.getLiteRoute($scope.liteRouteLabel);

    var todayTripsPromise = routePromise.then((route)=>{
      $scope.liteRoute = route[$scope.liteRouteLabel];
      var now = new Date();
      var lastMidnight = now.setHours(0, 0, 0, 0);
      var nextMidnight = now.setHours(24, 0, 0, 0);
      $scope.todayTrips = $scope.liteRoute.trips.filter(lr =>  Date.parse(lr.date) >= lastMidnight &&
                       Date.parse(lr.date) < nextMidnight && lr.isRunning);
      return $scope.todayTrips
    })

    var mapPromise = new Promise(function(resolve) {
      $scope.$watch('map.control.getGMap', function(getGMap) {
        if (getGMap) resolve($scope.map.control.getGMap());
      });
    });

    $scope.$on('$ionicView.afterEnter', () => {
      loadingSpinner(Promise.all([mapPromise, routePromise])
      .then(() => {
        var gmap = $scope.map.control.getGMap();
        google.maps.event.trigger(gmap, 'resize');
      }));
      $scope.$broadcast('startPingLoop');
    });

    $scope.$on('$ionicView.beforeLeave', () => {
      $scope.$broadcast('killPingLoop');
    });

    Promise.all([mapPromise, routePromise]).then((values) =>{
      var [map, route] = values;
      RoutesService.decodeRoutePath(route[$scope.liteRouteLabel].path)
      .then((path) => $scope.map.lines.route.path = path)
      .catch((err) => {
      });
    });

    Promise.all([mapPromise, uiGmapGoogleMapApi, todayTripsPromise]).then((values) => {
      var [map, googleMaps, todayTrips] = values;
      if (todayTrips.length ==0 ){
        $scope.hasNoTrip = true;
      }

      MapOptions.disableMapLinks();
      $scope.$on("$ionicView.afterEnter", function(event, data) {
        googleMaps.event.trigger(map, 'resize');
      });
      $scope.mapFrame = map;
    })

    $scope.promptUntrack = async function() {
      var response = await $ionicPopup.confirm({
        title: 'Are you sure you want to untrack this lite route?',
        subTitle: "This lite route will be removed from your tickets."
      })

      if (!response) return;

      try {
        var unsubscribeResult = await loadingSpinner(
          LiteRoutesService.unSubscribeLiteRoute($scope.liteRouteLabel)
        )

        if (unsubscribeResult) {
          await $ionicLoading.show({
            template: `
            <div>Done!</div>
            `,
            duration: 1000,
          })
          $state.transitionTo("tabs.tickets");
        }
      }
      catch(err) {
        await $ionicLoading.show({
          template: `
          <div>Error, please try again later.</div>
          `,
          duration: 1000,
        })
      }
    };

    $scope.disp.showTerms = function() {
      if (!$scope.liteRoute.transportCompanyId) return;
      CompanyService.showTerms($scope.liteRoute.transportCompanyId);
    };

  }
];
