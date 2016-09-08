import {NetworkError} from '../shared/errors';
import {formatDate, formatTime, formatUTCDate, formatHHMM_ampm} from '../shared/format';
import loadingTemplate from '../templates/loading.html';

export default [
  '$rootScope',
  '$scope',
  '$interpolate',
  '$state',
  '$stateParams',
  '$ionicModal',
  '$http',
  '$cordovaGeolocation',
  '$ionicPopup',
  '$ionicLoading',
  'RoutesService',
  'LiteRoutesService',
  'LiteRouteSubscriptionService',
  'UserService',
  'CompanyService',
  'uiGmapGoogleMapApi',
  'MapOptions',
  'loadingSpinner',
  function(
    $rootScope,
    $scope,
    $interpolate,
    $state,
    $stateParams,
    $ionicModal,
    $http,
    $cordovaGeolocation,
    $ionicPopup,
    $ionicLoading,
    RoutesService,
    LiteRoutesService,
    LiteRouteSubscriptionService,
    UserService,
    CompanyService,
    uiGmapGoogleMapApi,
    MapOptions,
    loadingSpinner
  ) {
    // Gmap default settings
    $scope.map = MapOptions.defaultMapOptions({
      lines: {
        route: { path: [] },
      },
    });

    $scope.disp = {};

    // Default settings for various info used in the page
    $scope.book = {
      label: null,
      route: null,
      boardStops: [], // all board stops for this route
      alightStops: [], // all alight stops for this route
      waitingForSubscriptionResult: false,
      isSubscribed: false,
    };

    // Resolved when the map is initialized
    var gmapIsReady = new Promise((resolve, reject) => {
      var resolved = false;
      $scope.$watch('map.control.getGMap', function() {
        if ($scope.map.control.getGMap) {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        }
      });
    });

    var routePromise, subscriptionPromise;

    $scope.book.label = $stateParams.label;

    routePromise = LiteRoutesService.getLiteRoute($scope.book.label);
    subscriptionPromise = LiteRouteSubscriptionService.isSubscribed($scope.book.label);

    subscriptionPromise.then((response)=>{
      $scope.book.isSubscribed = response;
    });

    var todayTripsPromise = routePromise.then((route)=>{
      $scope.book.route = route[$scope.book.label];
      var now = new Date();
      var lastMidnight = now.setHours(0, 0, 0, 0);
      var nextMidnight = now.setHours(24, 0, 0, 0);
      $scope.todayTrips = $scope.book.route.trips.filter(lr =>  Date.parse(lr.date) >= lastMidnight &&
                       Date.parse(lr.date) < nextMidnight && lr.isRunning);
      return $scope.todayTrips
    });

    $scope.$on('$ionicView.afterEnter', () => {
      loadingSpinner(Promise.all([gmapIsReady, routePromise, subscriptionPromise])
      .then(() => {
        var gmap = $scope.map.control.getGMap();
        google.maps.event.trigger(gmap, 'resize');
        panToStops();
      }));
      $scope.$broadcast('startPingLoop');
    });

    $scope.$on('$ionicView.beforeLeave', () => {
      $scope.$broadcast('killPingLoop');
    });

    var mapPromise = new Promise(function(resolve) {
      $scope.$watch('map.control.getGMap', function(getGMap) {
        if (getGMap) resolve($scope.map.control.getGMap());
      });
    });

    Promise.all([mapPromise, routePromise]).then((values) =>{
      var [map, route] = values;
      RoutesService.decodeRoutePath(route[$scope.book.label].path)
      .then((path) => $scope.map.lines.route.path = path)
      .catch((err) => {
        console.error(err);
      });
    });

    Promise.all([mapPromise, uiGmapGoogleMapApi, todayTripsPromise]).then((values) => {
      var [map, googleMaps, todayTrips] = values;
      console.log("today trips are ");
      console.log(todayTrips);
      if (todayTrips.length ==0 ){
       $scope.hasNoTrip = true;
      }

      MapOptions.disableMapLinks();
      $scope.$on("$ionicView.afterEnter", function(event, data) {
        googleMaps.event.trigger(map, 'resize');
      });

      $scope.mapFrame = map;
    })

    gmapIsReady.then(function() {
      MapOptions.disableMapLinks();
    });

    $scope.$watch('book.route.path', (path) => {
      if (!path) {
        $scope.routePath = [];
      }
      else {
        RoutesService.decodeRoutePath(path)
        .then((decodedPath) => $scope.routePath = decodedPath)
        .catch(() => $scope.routePath = []);
      }
    })

    $scope.$watch(() => UserService.getUser() && UserService.getUser().id, (userId) => {
      $scope.isLoggedIn = userId ? true : false;
      if ($scope.isLoggedIn) {
        $ionicLoading.show({
          template: loadingTemplate
        })
        try {
          LiteRouteSubscriptionService.isSubscribed($scope.book.label, true)
          .then((response) => {
            $scope.book.isSubscribed = response;
            $ionicLoading.hide();
            }
          )
        }
        catch(error) {
          $ionicLoading.hide();
        }
      }
      else {
        $scope.book.isSubscribed = false;
      }
    })

    $scope.login = function () {
      UserService.promptLogIn()
    }

    $scope.promptFollow = async function() {
      console.log("pressed");
      var response = await $ionicPopup.confirm({
        title: 'Are you sure you want to follow this lite route?',
        subTitle: "You will view the lite route tracker in tickets."
      })

      if (!response) return;

      try {
        $scope.book.waitingForSubscriptionResult = true;

        var subscribeResult = await loadingSpinner(
          LiteRoutesService.subscribeLiteRoute($scope.book.label)
        )

        if (subscribeResult) {
          $ionicPopup.alert({
            title: 'Success',
            template: `
            <div class="text-center item-text-wrap">
              <div>
                <img src="img/lite_success.svg">
              </div>
              You are now following this route.<br>
              Track your bus on the day of the trip.
            </div>
            `,
          })
          $scope.book.isSubscribed = true;
          $scope.book.route.isSubscribed = true;
        }
        $scope.book.waitingForSubscriptionResult = false;
      }
      catch(err) {
        $scope.book.waitingForSubscriptionResult = false;
        await $ionicLoading.show({
          template: `
          <div>Error, please try again later.</div>
          `,
          duration: 1000,
        })
      }
    };

    $scope.promptUntrack = async function() {
      console.log("pressed");
      var response = await $ionicPopup.confirm({
        title: 'Are you sure you want to untrack this lite route?',
        subTitle: "This lite route will be removed from your tickets."
      })

      if (!response) return;

      try {
        $scope.book.waitingForSubscriptionResult = true;

        var unsubscribeResult = await loadingSpinner(
          LiteRoutesService.unSubscribeLiteRoute($scope.book.label)
        )

        if (unsubscribeResult) {
          $scope.book.isSubscribed = false;
          $scope.book.route.isSubscribed = false;
        }
        $scope.book.waitingForSubscriptionResult = false;
        // $scope.$digest();

        if (!$scope.book.isSubscribed) {
          await $ionicLoading.show({
            template: `
            <div>Done!</div>
            `,
            duration: 1000,
          })
          $state.transitionTo("tabs.routes");
        }
      }
      catch(err) {
        $scope.book.waitingForSubscriptionResult = false;
        await $ionicLoading.show({
          template: `
          <div>Error, please try again later.</div>
          `,
          duration: 1000,
        })
      }
    };

    $scope.disp.showTerms = () => {
      if (!$scope.book.route.transportCompanyId) return;

      CompanyService.showTerms($scope.book.route.transportCompanyId);
    }

    /* Pans to the stops on the screen */
    function panToStops() {
      var stops = [];
      stops = $scope.book.boardStops.concat($scope.book.alightStops);
      console.log("stops", stops)
      console.log("route", $scope.book.route)
      console.log("panning")

      if (stops.length == 0) {
        return;
      }
      var bounds = new google.maps.LatLngBounds();
      for (let s of stops) {
        bounds.extend(new google.maps.LatLng(
          s.coordinates.coordinates[1],
          s.coordinates.coordinates[0]
        ));
      }
      $scope.map.control.getGMap().fitBounds(bounds);
    }
  }
];
