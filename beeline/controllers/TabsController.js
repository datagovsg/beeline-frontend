
export default [
  '$scope',
  'MapOptions',
  'SharedVariableService',
  'uiGmapGoogleMapApi',
  'UserService',
  'RoutesService',
  'LiteRoutesService',
  'LiteRouteSubscriptionService',
  function($scope, MapOptions, SharedVariableService, uiGmapGoogleMapApi, UserService,
    RoutesService, LiteRoutesService, LiteRouteSubscriptionService) {
    $scope.map = MapOptions.defaultMapOptions({
      busLocation: {
        coordinates: null,
        icon: null,
      }
    })

    $scope.disp = {
      popupStop: null,
      routeMessage: null,
    }

    $scope.data = {
      isLoggedIn: false,
      myBookingRoutes: [],
      myLiteRoutes: [],
      myActivatedCrowdstartRoutes: [],
      myActivatedCrowdstartRouteIds: [],
    }

    $scope.$watch(() => UserService.getUser(), (user) => {
      $scope.data.isLoggedIn = user !== null
    })

    // my Booking routes
    $scope.$watchGroup(
      [
        () => RoutesService.getRecentRoutes(),
        () => RoutesService.getRoutesWithRoutePass()
      ],
      ([recentRoutes, allRoutes]) => {
        // If we cant find route data here then proceed with empty
        // This allows it to organically "clear" any state
        if (!recentRoutes || !allRoutes) return;

        // "Fill in" the recent routes with the all routes data
        let allRoutesById = _.keyBy(allRoutes, 'id');
        $scope.data.myBookingRoutes = recentRoutes.map( (recentRoute) => {
          return _.assign({
            alightStopStopId: recentRoute.alightStopStopId,
            boardStopStopId: recentRoute.boardStopStopId
          }, allRoutesById[recentRoute.id]);
        // Clean out "junk" routes which may be old/obsolete
        }).filter( (route)=> route && route.id !== undefined);
      }
    );

    // my Lite routes
    $scope.$watchGroup(
      [
        () => LiteRoutesService.getLiteRoutes(),
        () => LiteRouteSubscriptionService.getSubscriptionSummary()
      ],
      ([liteRoutes, subscribed]) =>{
        // Input validation
        if (!liteRoutes || !subscribed) return;
        liteRoutes = Object.values(liteRoutes);

        let subscribedLiteRoutes = _.filter(liteRoutes, (route) => {
          return !!subscribed.includes(route.label)
        })
        // Sort by label and publish
        $scope.data.myLiteRoutes = _.sortBy(subscribedLiteRoutes, route => {
          return parseInt(route.label.slice(1));
        });
      }
    )

    // Kickstarted routes
    $scope.$watchCollection(() => RoutesService.getActivatedKickstarterRoutes(), (routes) => {
      $scope.data.myActivatedCrowdstartRoutes = routes;
      $scope.data.myActivatedCrowdstartRouteIds = _.map(routes, r => r.id);
    })

    // blend activatedCrowdstartRoutes and recentRoutes
    $scope.$watchGroup(
      ['data.myActivatedCrowdstartRouteIds', 'data.myBookingRoutes'],
      ([activatedCrowdstartRouteIds, recentRoutes]) => {
        if (activatedCrowdstartRouteIds && recentRoutes) {
          let recentRouteIds = _.map(recentRoutes, route => route.id)
          $scope.data.myActivatedCrowdstartRoutes = _.filter ($scope.data.myActivatedCrowdstartRoutes,
            (route) => !recentRouteIds.includes(route.id)
          );
        }
      });

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


    gmapIsReady.then(() => {
      MapOptions.disableMapLinks();
    })

    uiGmapGoogleMapApi.then((googleMaps) => {
      $scope.map.busLocation.icon = {
        url: `img/busMarker.svg`,
        scaledSize: new googleMaps.Size(68, 86),
        anchor: new googleMaps.Point(34, 78),
      }
    })

    $scope.$watch('mapObject.stops', (stops) => {
      if (stops && stops.length > 0) {
        var bounds = MapOptions.formBounds(stops);
        if ($scope.map.control.getGMap) {
          var gmap = $scope.map.control.getGMap()
          google.maps.event.trigger(gmap, 'resize')
          gmap.fitBounds(bounds)
        }
      }
    })

    var originalMapObject = {
      stops: [],
      routePath: [],
      alightStop: null,
      boardStop: null,
      pingTrips: [],
      allRecentPings: [],
      chosenStop: null,
      statusMessages: [],
    }

    $scope.mapObject = _.assign({}, originalMapObject)

    $scope.$watch(() => SharedVariableService.get(), (data) => {
      $scope.mapObject = _.assign($scope.mapObject, data)
    }, true)

    function panToStop(stop, setZoom) {
      if ($scope.map.control.getGMap) {
        var gmap = $scope.map.control.getGMap()
        gmap.panTo({
          lat: stop.coordinates.coordinates[1],
          lng: stop.coordinates.coordinates[0],
        })
        if (setZoom) {
          gmap.setZoom(17)
        }
      }
    }

    $scope.$watch('mapObject.chosenStop', (stop) => {
      if (stop) {
        panToStop(stop, true)
      }
    })

    $scope.$watch('mapObject.boardStop', (stop) => {
      if (stop) {
        panToStop(stop.stop)
      }
    })

    $scope.$watch('mapObject.alightStop', (stop) => {
      if (stop) {
        panToStop(stop.stop)
      }
    })

  }
];
