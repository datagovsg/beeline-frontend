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
  'BookingService',
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
    BookingService,
    RoutesService,
    LiteRoutesService,
    LiteRouteSubscriptionService,
    UserService,
    CompanyService,
    uiGmapGoogleMapApi,
    MapOptions,
    loadingSpinner
  ) {
    $scope.disp = {};
    // Gmap default settings
    $scope.map = MapOptions.defaultMapOptions();
    $scope.routePath = [];

    // Default settings for various info used in the page
    $scope.book = {
      label: null,
      route: null,
      boardStops: [], // all board stops for this route
      alightStops: [], // all alight stops for this route
      boardStop: null,
      alightStop: null,
      changes: {},
      waitingForSubscriptionResult: false,
      isSubscribed: false,
    };
    $scope.disp = {
      popupStop: null,
      popupStopType: null,
      parentScope: $scope,
    }

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

    subscriptionPromise = LiteRouteSubscriptionService.isSubscribed($scope.book.label);

    routePromise = LiteRoutesService.getLiteRoute($scope.book.label);

    var stopOptions = {
      initialBoardStopId: $stateParams.boardStop ? parseInt($stateParams.boardStop) : undefined,
      initialAlightStopId: $stateParams.alightStop ? parseInt($stateParams.alightStop) : undefined,
    };
    routePromise.then((route) => {
      $scope.book.route = route[$scope.book.label];
      // computeStops(stopOptions);
      console.log("RouteObject", route)
      var trips = $scope.book.route.trips;
      var [boardStops, alightStops] = BookingService.computeStops(trips);
      $scope.book.boardStops = boardStops;
      $scope.book.alightStops = alightStops;
    });

    $scope.$on('$ionicView.afterEnter', () => {
      loadingSpinner(Promise.all([gmapIsReady, routePromise, subscriptionPromise])
      .then(() => {
        var gmap = $scope.map.control.getGMap();
        google.maps.event.trigger(gmap, 'resize');
        panToStops();
      }));
    });

    subscriptionPromise.then((response)=>{
      $scope.book.isSubscribed = response;
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


    $scope.setStop = function (stop, type) {
      if (type === 'pickup') {
        $scope.book.boardStop = stop;
      }
      else {
        $scope.book.alightStop = stop;
      }
      $scope.disp.popupStop = null;
    }

    $scope.$watch(() => UserService.getUser(), async(user) => {
      $scope.isLoggedIn = user ? true : false;
      if ($scope.isLoggedIn) {
        $ionicLoading.show({
          template: loadingTemplate
        })
        $ionicLoading.hide();
      }
    })

    $scope.login = function () {
      UserService.promptLogIn()
    }

    $scope.promptFollow = function() {
      console.log("pressed");
      $ionicPopup.confirm({
        title: 'Are you sure you want to follow this lite route?',
        subTitle: "You will view the lite route tracker in tickets."
      }).then(function(response) {
        if (response) {
          try {
            $scope.book.waitingForSubscriptionResult = true;
            loadingSpinner(
              LiteRoutesService.subscribeLiteRoute($scope.book.route.label).then(function(response)
              {
                if (response) {
                  $ionicPopup.alert({
                    title: 'Success',
                  })
                  $scope.book.isSubscribed = true;
                  $scope.book.route.isSubscribed = true;
                }
                else {
                  $ionicPopup.alert({
                    title: 'Error subscribing lite route',
                  })
                }
                $scope.book.waitingForSubscriptionResult = false;
              })
            )
          }
          catch(err) {
            $ionicPopup.alert({
              title: 'Error subscribing lite route ' + err,
            })
          }
        }
      });
    };

    $scope.promptUntrack = function() {
      console.log("pressed");
      $ionicPopup.confirm({
        title: 'Are you sure you want to untrack this lite route?',
        subTitle: "This lite route will be removed from your tickets."
      }).then(function(response) {
        if (response) {
          try {
            $scope.book.waitingForSubscriptionResult = true;
            loadingSpinner(
              LiteRoutesService.unSubscribeLiteRoute($scope.book.route.label).then(function(response)
              {
                if (response) {
                  $ionicPopup.alert({
                    title: 'Success',
                  })
                  $scope.book.isSubscribed = false;
                  $scope.book.route.isSubscribed = false;
                }
                else {
                  $ionicPopup.alert({
                    title: 'Error untracking lite route',
                  })
                }
                $scope.book.waitingForSubscriptionResult = false;
              })
            )
          }
          catch(err) {
            $ionicPopup.alert({
              title: 'Error untracking lite route ' + err,
            })
          }
        }
      });
    };

    $scope.disp.showTerms = () => {
      if (!$scope.book.route.transportCompanyId) return;

      CompanyService.showTerms($scope.book.route.transportCompanyId);
    }

    $scope.applyTapBoard = function (stop) {
      $scope.disp.popupStopType = "pickup";
      $scope.disp.popupStop = stop;
      $scope.$digest();
    }

    /* Pans to the stops on the screen */
    function panToStops() {
      var stops = [];
      stops = $scope.book.boardStops.concat($scope.book.alightStops);

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
