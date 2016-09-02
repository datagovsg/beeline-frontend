import _ from 'lodash';
import assert from 'assert';

export default [
  '$scope', '$rootScope', '$stateParams', '$timeout', 'uiGmapGoogleMapApi',
  'CompanyService', 'TripService', 'UserService', 'MapOptions', 'RoutesService',
  'LiteRoutesService', '$ionicPopup',
  function(
    $scope,  $rootScope,  $stateParams,  $timeout,  uiGmapGoogleMapApi,
    CompanyService, TripService,  UserService, MapOptions, RoutesService,
    LiteRoutesService,  $ionicPopup
  ) {

    // Initialize the necessary basic data data
    $scope.user = UserService.getUser();
    $scope.map = MapOptions.defaultMapOptions({
      lines: {
        route: { path: [] },
        actualPaths: [
          { path: [] }
        ],
      },
      busLocations: [
        { coordinates: null,
          icon: null,}
      ]
    });

    $scope.disp = {
      popupStop: null,
      popupStopType: null,
      parentScope: $scope,
    }

    $scope.applyTapBoard = function (values) {
      console.log("Tapped");
      console.log(values);
      $scope.disp.popupStopType = "pickup";
      $scope.disp.popupStop = values.model;
      console.log("popup stop is ");
      console.log($scope.disp.popupStop);
      $scope.$digest();
    }

    $scope.recentPings = [];
    $scope.liteRouteLabel = $stateParams.liteRouteLabel;

    var routePromise = LiteRoutesService.getLiteRoute($scope.liteRouteLabel);
    routePromise.then((liteRoute) => {
      $scope.liteRoute = liteRoute[$scope.liteRouteLabel];
      console.log("lite route trips are");
      console.log($scope.liteRoute.trips);
      $scope.tripStops = LiteRoutesService.computeLiteStops($scope.liteRoute.trips);
      $scope.trip = $scope.liteRoute.trips[0];
    });

    var todayTripsPromise = routePromise.then((route)=>{
      var now = new Date();
      var lastMidnight = now.setHours(0, 0, 0, 0);
      var nextMidnight = now.setHours(24, 0, 0, 0);
      return $scope.todayTrips = $scope.liteRoute.trips.filter(lr =>  Date.parse(lr.date) >= lastMidnight &&
                       Date.parse(lr.date) < nextMidnight && lr.isRunning);
    })

    // Loop to get pings from the server every 15s between responses
    // Using a recursive timeout instead of an interval to avoid backlog
    // when the server is slow to respond
    var pingTimer;
    function pingLoop() {
       console.log("Ping again!");
       Promise.all($scope.todayTrips.map((trip, index)=>{
         console.log("currently is pinging "+trip.id);
        return TripService.DriverPings(trip.id)
        .then((info) => {
          /* Only show pings from the last two hours */
          var now = Date.now();
          return $scope.recentPings[index] = _.filter(info.pings,
            ping => now - ping.time.getTime() < 2*60*60*1000);
        })
      }))
      .then(() => {
        pingTimer = $timeout(pingLoop, 15000);
      }); // catch all errors

    }
    todayTripsPromise.then(()=>{
      console.log("start to ping!");
      pingLoop();
    });

    $scope.$on('$ionicView.beforeLeave', () => {
      $timeout.cancel(pingTimer);
    });


    var mapPromise = new Promise(function(resolve) {
      $scope.$watch('map.control.getGMap', function(getGMap) {
        if (getGMap) resolve($scope.map.control.getGMap());
      });
    });

    Promise.all([mapPromise, routePromise]).then((values) =>{
      var [map, route] = values;
      RoutesService.decodeRoutePath(route[$scope.liteRouteLabel].path)
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

       var icon = {
           url: 'img/busMarker.svg',
           scaledSize: new googleMaps.Size(68, 86),
           anchor: new googleMaps.Point(34, 78),
         };
       todayTrips.map((trip, index)=>{
        $scope.map.busLocations.splice(index,0, {
          "icon": icon
        })
          console.log($scope.map.busLocations);
        })
        // for (let ts of todayTrips[0].tripStops) {
        for (let ts of $scope.tripStops) {
          ts._markerOptions = ts.canBoard ? $scope.map.markerOptions.boardMarker :
                                   $scope.map.markerOptions.alightMarker;
        }

      // Just show the boarding stops
      var bounds = new googleMaps.LatLngBounds();
      // for (let tripStop of $scope.todayTrips[0].tripStops) {
      for (let tripStop of $scope.tripStops) {
          bounds.extend(new google.maps.LatLng(tripStop.coordinates.coordinates[1],
                                               tripStop.coordinates.coordinates[0]));
        }
        map.fitBounds(bounds);
      })

      // Draw the icon for latest bus location
      $scope.$watchCollection('recentPings', function(recentPings) {
        console.log("recent pings are here ");
        console.log(recentPings);
        if (recentPings) {
          recentPings.map((pings, index)=>{
            if (pings.length > 0){

              var coordinates = pings[0].coordinates;
              var path = pings.map(ping => ({
                latitude: ping.coordinates.coordinates[1],
                longitude: ping.coordinates.coordinates[0]
              }));
              $scope.map.busLocations[index].coordinates = coordinates;
              $scope.map.lines.actualPaths.splice(index,0, {
                "path": path
              })
            }
          })
        }
      });

    $scope.unSubscribe = function() {
      $ionicPopup.confirm({
        title: 'Unfollow Route?',
        subTitle: "Are you sure you want to unfollow this route? You will not be able track this route."
      }).then(function(response) {
        if (response) {
          try {
            LiteRoutesService.unSubscribeLiteRoute($scope.liteRouteLabel).then(function(response)
            {
              if (response) {
                $ionicPopup.alert({
                  title: 'Success',
                })
              }
              else {
                $ionicPopup.alert({
                  title: 'Error unSubscribing lite route',
                })
              }
            })
          }
          catch(err) {
            $ionicPopup.alert({
              title: 'Error unSubscribing lite route ' + err,
            })
          }
        }
      });
    };

    $scope.showTerms = function() {
      if (!$scope.liteRoute.transportCompanyId) return;
      CompanyService.showTerms($scope.liteRoute.transportCompanyId);
    };

  }
];
