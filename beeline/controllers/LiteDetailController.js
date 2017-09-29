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
  'SharedVariableService',
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
    loadingSpinner,
    SharedVariableService
  ) {

    $scope.disp = {
      companyInfo: {},
      showTooltip: true,
    };

    // Default settings for various info used in the page
    $scope.book = {
      label: null,
      route: null,
      boardStops: [], // all board stops for this route
      alightStops: [], // all alight stops for this route
      waitingForSubscriptionResult: false,
      isSubscribed: false,
      todayTrips: null,
      inServiceWindow: false,
      hasTrips: true,
    };

    $scope.$watch('book.todayTrips',(trips)=>{
      if (!trips) return;
      $scope.book.hasTrips = trips.length > 0
    });

    $scope.mapObject = {
      stops: [],
      routePath: [],
      alightStop: null,
      boardStop: null,
      pingTrips: [],
      allRecentPings: [],
      chosenStop: null,
      statusMessages: [],
    }

    var routePromise, subscriptionPromise;

    $scope.book.label = $stateParams.label;

    routePromise = LiteRoutesService.fetchLiteRoute($scope.book.label);
    subscriptionPromise = LiteRouteSubscriptionService.isSubscribed($scope.book.label);

    subscriptionPromise.then((response)=>{
      $scope.book.isSubscribed = response;
    });

    var availableTripsPromise = routePromise.then((route)=>{
      $scope.book.route = route[$scope.book.label];
      if (route[$scope.book.label].path) {
        RoutesService.decodeRoutePath(route[$scope.book.label].path)
          .then((decodedPath) => {
            // $scope.mapObject.routePath = decodedPath
            // SharedVariableService.setRoutePath(decodedPath)
          })
          .catch(() => {
            $scope.mapObject.routePath = []
            SharedVariableService.setRoutePath([])
          })
      }
      //get route features
      RoutesService.getRouteFeatures($scope.book.route.id).then((data)=>{
        $scope.disp.features = data;
      });
      $scope.book.route.trips = _.sortBy($scope.book.route.trips, (trip)=>{
        return trip.date
      })
      let nextTrips = $scope.book.route.trips.filter(
        trip=>trip.date === $scope.book.route.trips[0].date)
      var liteTripStops = LiteRoutesService.computeLiteStops(nextTrips)
      $scope.mapObject.stops = liteTripStops;
      SharedVariableService.setStops(liteTripStops)
    });

    $scope.$watch('book.todayTrips', (todayTrips) => {
      console.log('today trips')
      if (todayTrips && todayTrips.length > 0) {
        $scope.mapObject.pingTrips = todayTrips;
        SharedVariableService.setPingTrips(todayTrips);
      }
    })

    $scope.$on('$ionicView.afterEnter', () => {
      loadingSpinner(Promise.all([routePromise, subscriptionPromise])
      .then(() => {
        console.log($scope.mapObject)
        // to plot the map
        SharedVariableService.set($scope.mapObject)
        $scope.$broadcast('startPingLoop');
      }));
    });

    $scope.$on('$ionicView.beforeLeave', () => {
      $scope.$broadcast('killPingLoop');
    });

    $scope.$watch(() => UserService.getUser() && UserService.getUser().id, (userId) => {
      $scope.isLoggedIn = userId ? true : false;
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

    $scope.showConfirmationPopup = function() {
      return $scope.confirmationPopup = $ionicPopup.show({
        scope: $scope,
        template: `
        <div class="item item-text-wrap">
          <div>
              Please read {{disp.companyInfo.name}}'s <a ng-click="disp.showTerms()">Terms and Conditions of Service</a>.
          </div>
          <ion-checkbox ng-model="disp.termsChecked">
            Yes, I have read and agree to the above Terms and Conditions and would like to proceed.
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
          $ionicPopup.alert({
            title: 'Success',
            template: `
            <div class="item item-text-wrap text-center ">
              <div>
                <img src="img/lite_success.svg">
              </div>
              <p>You bookmarked this route.<br>
              Track your bus on the day of the trip.
              </p>
            </div>
            `,
          })
          .then(() => {
            $state.transitionTo("tabs.tickets");
          })
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
      finally {
        $scope.book.waitingForSubscriptionResult = false;
      }
    };

    // TODO: Move bulk of promptUntrack code into service or directive as both
    // LiteSummaryController and LiteRouteTrackerController uses it
    $scope.promptUntrack = async function() {
      var response = await $ionicPopup.confirm({
        title: 'Are you sure you want to unbookmark this route?',
        subTitle: "This tracking-only route will be removed from your trips list."
      })

      if (!response) return;

      try {
        $scope.book.waitingForSubscriptionResult = true;

        var unsubscribeResult = await loadingSpinner(
          LiteRoutesService.unsubscribeLiteRoute($scope.book.label)
        )

        if (unsubscribeResult) {
          $scope.book.isSubscribed = false;
        }

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
        await $ionicLoading.show({
          template: `
          <div>Error, please try again later.</div>
          `,
          duration: 1000,
        })
      }
      finally {
        $scope.book.waitingForSubscriptionResult = false;
      }
    };

    $scope.disp.showTerms = async () => {
      if (!$scope.book.route.transportCompanyId) return;

      $scope.confirmationPopup.close();

      await CompanyService.showTerms($scope.book.route.transportCompanyId)

      $scope.showConfirmationPopup();
    }

    $scope.hideTooltip = () => {
      if ($scope.disp.showTooltip) {
        $scope.disp.showTooltip = false;
      }
    }
  }
];
