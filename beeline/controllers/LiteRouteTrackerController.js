import _ from 'lodash';
import {SafeInterval} from '../SafeInterval';

export default [
  '$scope', '$rootScope', '$state', '$stateParams', 'uiGmapGoogleMapApi',
  'CompanyService', 'TripService', 'UserService', 'MapOptions', 'RoutesService',
  'LiteRoutesService', '$ionicPopup', '$ionicLoading', 'loadingSpinner',
  '$http',
  function(
    $scope,  $rootScope, $state, $stateParams,  uiGmapGoogleMapApi,
    CompanyService, TripService,  UserService, MapOptions, RoutesService,
    LiteRoutesService,  $ionicPopup, $ionicLoading, loadingSpinner,
    $http
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
      todayTrips : null,
      hasTrackingData: true,
      inServiceWindow: false,
      nextTrips: null,
      tripArrivalPredictions: {},
    }

    $scope.liteRouteLabel = $stateParams.liteRouteLabel;

    var routePromise = LiteRoutesService.fetchLiteRoute($scope.liteRouteLabel);

    var availableTripsPromise = routePromise.then((route)=>{
      $scope.liteRoute = route[$scope.liteRouteLabel];
      //get route features
      RoutesService.getRouteFeatures($scope.liteRoute.id).then((data)=>{
        $scope.disp.features = data;
      });
      $scope.liteRoute.trips = _.sortBy($scope.liteRoute.trips, (trip)=>{
        return trip.date
      })
      $scope.data.nextTrips = $scope.liteRoute.trips.filter(
        trip=>trip.date === $scope.liteRoute.trips[0].date);
    })

    /* Updated by the view using <daily-trips></daily-trips> (yes, I know, it's ugly) */
    $scope.$watch('data.todayTrips',(trips)=>{
      if (!trips) return;
      $scope.hasTrips = trips.length > 0
    });

    const arrivalTimePrediction = new SafeInterval(
      () => {
        const tripIds = $scope.data.todayTrips && $scope.data.todayTrips.map(trip => trip.id)

        if (!tripIds) return Promise.resolve()

        const promise = Promise.all(
          tripIds.map(async (tripId) => {
            const response = await $http.get(`https://beeline-eta.herokuapp.com/api/v1.0/${tripId}`)

            const timeFormatRE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/

            $scope.data.tripArrivalPredictions = {
              ...$scope.data.tripArrivalPredictions,
              [tripId]: _.mapValues(response.data, v => v.valid && timeFormatRE.test(v.timeToArrival) ? v : null)
            }
          })
        )

        return promise
      },
      5e3,
      5e3
    )
    arrivalTimePrediction.start()



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
          <div> There was an error unsubscribing. ${err && err.data && err.data.message} Please try again later.</div>
          `,
          duration: 1000,
        })
      }
    };

    $scope.disp.showTerms = function() {
      if (!$scope.liteRoute.transportCompanyId) return;
      CompanyService.showTerms($scope.liteRoute.transportCompanyId);
    };

    $scope.locateMe = function(){
      mapPromise.then(()=>{
        MapOptions.locateMe($scope.map.control);
      })
    };

  }
];
