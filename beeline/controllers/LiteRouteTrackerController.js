import _ from 'lodash';

export default [
  '$scope', '$rootScope', '$state', '$stateParams', '$timeout', 'uiGmapGoogleMapApi',
  'CompanyService', 'TripService', 'UserService', 'MapOptions', 'RoutesService',
  'LiteRoutesService', '$ionicPopup', '$ionicLoading', 'loadingSpinner',
  function(
    $scope,  $rootScope, $state, $stateParams,  $timeout,  uiGmapGoogleMapApi,
    CompanyService, TripService,  UserService, MapOptions, RoutesService,
    LiteRoutesService,  $ionicPopup, $ionicLoading, loadingSpinner
  ) {
    // Initialize the necessary basic data data
    $scope.user = UserService.getUser();
    $scope.map = MapOptions.defaultMapOptions({
      lines: {
        route: { path: [] },
      },
    });

    $scope.disp = {}

    $scope.hasTrips = true;

    $scope.data ={
      availableTrips : [],
    }

    $scope.liteRouteLabel = $stateParams.liteRouteLabel;

    var routePromise = LiteRoutesService.getLiteRoute($scope.liteRouteLabel);

    var availableTripsPromise = routePromise.then((route)=>{
      $scope.liteRoute = route[$scope.liteRouteLabel];
    })

    $scope.$watch('data.availableTrips',(trips)=>{
      if (trips.length == 0) return;
      $scope.hasTrips = !(trips[0] && new Date(trips[0].date).setHours(0,0,0,0) != new Date().setHours(0,0,0,0));
      //get route features
      RoutesService.getRouteFeatures(trips[0].routeId).then((data)=>{
        $scope.disp.features = data;
      })
    });

    var mapPromise = new Promise(function(resolve) {
      $scope.$watch('map.control.getGMap', function(getGMap) {
        if (getGMap) resolve($scope.map.control.getGMap());
      });
    });

    $scope.$on('$ionicView.afterEnter', () => {
      $scope.$broadcast('startPingLoop');
      loadingSpinner(Promise.all([mapPromise, routePromise])
      .then(() => {
        var gmap = $scope.map.control.getGMap();
        google.maps.event.trigger(gmap, 'resize');
      }));
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

    Promise.all([mapPromise, uiGmapGoogleMapApi]).then((values) => {
      var [map, googleMaps] = values;
      MapOptions.disableMapLinks();
      $scope.$on("$ionicView.afterEnter", function(event, data) {
        googleMaps.event.trigger(map, 'resize');
      });
    })

    // TODO: Move bulk of promptUntrack code into service or directive as both
    // LiteSummaryController and LiteRouteTrackerController uses it
    $scope.promptUntrack = async function() {
      var response = await $ionicPopup.confirm({
        title: 'Are you sure you want to untrack this route?',
        subTitle: "This tracking-only route will be removed from your list of trips."
      })

      if (!response) return;

      try {
        var unsubscribeResult = await loadingSpinner(
          LiteRoutesService.unsubscribeLiteRoute($scope.liteRouteLabel)
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
          <div> There was an error unsubscribing. {{err && err.data && err.data.message}} Please try again later.</div>
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
