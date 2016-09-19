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

    $scope.disp = {
      companyInfo: {}
    };

    // Default settings for various info used in the page
    $scope.book = {
      label: null,
      route: null,
      boardStops: [], // all board stops for this route
      alightStops: [], // all alight stops for this route
      waitingForSubscriptionResult: false,
      isSubscribed: false,
    };

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

    var mapPromise = new Promise(function(resolve) {
      $scope.$watch('map.control.getGMap', function(getGMap) {
        if (getGMap) resolve($scope.map.control.getGMap());
      });
    });

    $scope.$on('$ionicView.afterEnter', () => {
      loadingSpinner(Promise.all([mapPromise, routePromise, subscriptionPromise])
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
      console.log("Route is:", route);
      RoutesService.decodeRoutePath(route[$scope.book.label].path)
      .then((path) => $scope.map.lines.route.path = path)
      .catch((err) => {
        console.error(err);
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

    $scope.$watchCollection( () => [].concat(LiteRouteSubscriptionService.getSubscriptionSummary()),
    (newValue) => {
      LiteRouteSubscriptionService.isSubscribed($scope.book.label)
      .then((response) => {
        if (response) {
          $scope.book.isSubscribed = true;
        }
        else {
          $scope.book.isSubscribed = false;
        }
      })
    });

    $scope.login = function () {
      UserService.promptLogIn()
    }

    $scope.confirmationPopup = function() {
      return $scope.trackPopup = $ionicPopup.show({
        scope: $scope,
        template: `
        <div class="item item-text-wrap">
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
          LiteRoutesService.subscribeLiteRoute($scope.book.label)
        )

        if (subscribeResult) {
          $scope.book.isSubscribed = true;
          $scope.book.route.isSubscribed = true;
          $ionicPopup.alert({
            title: 'Success',
            template: `
            <div class="item item-text-wrap text-center ">
              <div>
                <img src="img/lite_success.svg">
              </div>
              <p>You are now following this route.<br>
              Track your bus on the day of the trip.
              </p>
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

    $scope.disp.showTerms = async () => {
      if (!$scope.book.route.transportCompanyId) return;

      $scope.trackPopup.close();

      await CompanyService.showTerms($scope.book.route.transportCompanyId)

      $scope.confirmationPopup();
    }
  }
];
