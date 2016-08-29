import _ from 'lodash';
import assert from 'assert';

export default [
  '$scope',
  '$rootScope',
  '$stateParams',
  '$timeout',
  'uiGmapGoogleMapApi',
  'CompanyService',
  'TripService',
  'UserService',
  'MapOptions',
  'RoutesService',
  'LiteRoutesService',
  '$ionicPopup',
  function(
    $scope,
    $rootScope,
    $stateParams,
    $timeout,
    uiGmapGoogleMapApi,
    CompanyService,
    TripService,
    UserService,
    MapOptions,
    RoutesService,
    LiteRoutesService,
    $ionicPopup
  ) {

    // Initialize the necessary basic data data
    $scope.user = UserService.getUser();
    $scope.map = MapOptions.defaultMapOptions({
      lines: {
        route: { path: [] },
        // actualPath: { path: [] },
        actualPaths: [],
      },
      // busLocation: {
      //   coordinates: null,
      //   icon: null,
      // },
      busLocations: []
    });
    $scope.recentPings = [];
    $scope.liteRouteLabel = $stateParams.liteRouteLabel;
    var routePromise = LiteRoutesService.getLiteRoute($scope.liteRouteLabel);
    routePromise.then((liteRoute) => {
      $scope.liteRoute = liteRoute[$scope.liteRouteLabel];
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
       Promise.all([$scope.todayTrips.map((trip, index)=>{
        return TripService.DriverPings(trip.id)
        .then((info) => {
          /* Only show pings from the last two hours */
          var now = Date.now();
          $scope.recentPings[index] = _.filter(info.pings,
            ping => now - ping.time.getTime() < 2*60*60*1000);
        })
        .then(null, () => {})
      })])
      .then(() => {
        pingTimer = $timeout(pingLoop, 15000);
      }); // catch all errors

    }
    todayTripsPromise.then(pingLoop);
    $scope.$on('$destroy', () => { $timeout.cancel(pingTimer); });

    // Draw the planned route
    routePromise.then((route) => {
      RoutesService.decodeRoutePath(route[$scope.liteRouteLabel].path)
      .then((path) => $scope.map.lines.route.path = path)
      .catch((err) => {
        console.error(err);
      });
    });

    Promise.all([uiGmapGoogleMapApi, todayTripsPromise]).then((values) => {
       var [googleMaps, todayTrips] = values;
       console.log("today trips are ");
       console.log(todayTrips);
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
    })

    // Draw the icon for latest bus location
    $scope.$watch('recentPings', function(recentPings) {
      if (recentPings) {
        recentPings.map((pings, index)=>{
          if (pings.length > 0){

            var coordinates = pings[0].coordinates;
            var path = pings.map(ping => ({
              latitude: ping.coordinates.coordinates[1],
              longitude: ping.coordinates.coordinates[0]
            }));
            $scope.map.busLocations.splice(index, 0, {
              "coordinates": coordinates,
            })
            $scope.map.lines.actualPaths.splice(index,0, {
              "path": path
            })
            // $scope.map.busLocations[index].coordinates = pings[0].coordinates;
            // $scope.map.lines.actualPaths[index].path = pings.map(ping => ({
            //   latitude: ping.coordinates.coordinates[1],
            //   longitude: ping.coordinates.coordinates[0]
            // }));
          }
        })
      }
    });

    //
    // $scope.$watch('map.markerOptions.boardMarker.icon', (icon) => {
    //   if (!icon) return;
    //   routePromise.then((trip) => {
    //     for (let ts of trip.tripStops) {
    //       ts._markerOptions = ts.canBoard ? $scope.map.markerOptions.boardMarker :
    //                                $scope.map.markerOptions.alightMarker;
    //     }
    //   })
    // })

    // Pan and zoom to the bus location when the map is ready
    // Single ping request for updating the map initially
    // Duplicates a bit with the update loop but is much cleaner this way
    // If the load ever gets too much can easily integrate into the
    // main update loop
    var mapPromise = new Promise(function(resolve) {
      $scope.$watch('map.control.getGMap', function(getGMap) {
        if (getGMap) resolve($scope.map.control.getGMap());
      });
    });

    var mapPromise = new Promise(function(resolve) {
      $scope.$watch('map.control.getGMap', function(getGMap) {
        if (getGMap) resolve($scope.map.control.getGMap());
      });
    });
    Promise.all([
      mapPromise,
      uiGmapGoogleMapApi
    ]).then((values) => {
      var [map, googleMaps] = values;
      // Just show the boarding stops
      var bounds = new googleMaps.LatLngBounds();
      for (let tripStop of $scope.todayTrips[0].tripStops) {
        bounds.extend(new google.maps.LatLng(tripStop.stop.coordinates.coordinates[1],
                                             tripStop.stop.coordinates.coordinates[0]));
      }
      map.fitBounds(bounds);
    });

    // ////////////////////////////////////////////////////////////////////////
    // Hack to fix map resizing due to ionic view cacheing
    // Need to use the rootscope since ionic view enter stuff doesnt seem
    // to propagate down to child views and scopes
    // ////////////////////////////////////////////////////////////////////////
    Promise.all([mapPromise, uiGmapGoogleMapApi]).then(function(values) {
      var [map, googleMaps] = values;

      MapOptions.disableMapLinks();
      $scope.$on("$ionicView.afterEnter", function(event, data) {
        googleMaps.event.trigger(map, 'resize');
      });
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
