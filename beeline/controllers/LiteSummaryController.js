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
      companyInfo: {}
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

    $scope.confirmationPopup = function() {
      return $scope.trackPopup = $ionicPopup.show({
        scope: $scope,
        template: `
        <div class="item-text-wrap">
          <div>
              Please read {{disp.companyInfo.name}}'s <a ng-click="disp.showTerms()">Terms and Conditions</a>.
          </div>
          <ion-checkbox ng-model="disp.termsChecked">
            I read and agree to the above terms and would like to proceed.
          </ion-checkbox>
        </div>
        `,
        cssClass: "popup-no-head",
        buttons: [{
          text: "Cancel",
          type: "button-default",
          onTap: () => {return false;},
        },
        {
          text: "OK",
          type: "button-positive",
          onTap: (e) => {
            if (!$scope.disp.termsChecked) {
              e.preventDefault();
            }
            else {
              $scope.followRoute();
            }
          },
        }]
      })
    }

    $scope.followRoute = async function() {

      try {
        $scope.book.waitingForSubscriptionResult = true;

        var subscribeResult = await loadingSpinner(
          LiteRoutesService.subscribeLiteRoute($scope.book.route.label)
        )

        if (subscribeResult) {
          $scope.book.isSubscribed = true;
          $scope.book.route.isSubscribed = true;
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
          .then(() => {
            $state.transitionTo("tabs.tickets");
          })
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
          LiteRoutesService.unSubscribeLiteRoute($scope.book.route.label)
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

    $scope.disp.showTerms = async () => {
      if (!$scope.book.route.transportCompanyId) return;

      $scope.trackPopup.close();

      await CompanyService.showTerms($scope.book.route.transportCompanyId)

      $scope.confirmationPopup();
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
