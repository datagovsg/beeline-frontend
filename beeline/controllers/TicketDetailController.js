import _ from 'lodash';

export default [
  '$scope',
  '$rootScope',
  '$stateParams',
  '$timeout',
  'uiGmapGoogleMapApi',
  'TicketService',
  'CompanyService',
  'TripService',
  'UserService',
  'MapOptions',
  'RoutesService',
  function(
    $scope,
    $rootScope,
    $stateParams,
    $timeout,
    uiGmapGoogleMapApi,
    TicketService,
    CompanyService,
    TripService,
    UserService,
    MapOptions,
    RoutesService
  ) {

    // Initialize the necessary basic data data
    $scope.user = UserService.getUser();
    $scope.map = MapOptions.defaultMapOptions({
      lines: {
        route: { path: [] },
        actualPath: { path: [] },
      },
      busLocation: {
        coordinates: null,
        icon: null,
      },
      markers: {
        boardStop: {},
        alightStop: {},
      }
    });

    $scope.showTerms = (companyId) => {
      CompanyService.showTerms(companyId);
    };

    var ticketPromise = TicketService.getTicketById(+$stateParams.ticketId);
    var tripPromise = ticketPromise.then((ticket) => {
      return TripService.getTripData(+ticket.alightStop.tripId);
    });
    var routePromise = tripPromise.then((trip) => {
      return RoutesService.getRoute(+trip.routeId);
    });
    var companyPromise = tripPromise.then((trip) => {
      return CompanyService.getCompany(+trip.transportCompanyId);
    });
    ticketPromise.then((ticket) => { $scope.ticket = ticket; });
    tripPromise.then((trip) => { $scope.trip = trip; });
    routePromise.then((route) => { $scope.route = route; });
    companyPromise.then((company) => { $scope.company = company; });

    // Loop to get pings from the server every 15s between responses
    // Using a recursive timeout instead of an interval to avoid backlog
    // when the server is slow to respond
    var pingTimer;
    function pingLoop() {
      TripService.DriverPings($scope.trip.id)
      .then((info) => {
        $scope.info = info;

        /* Only show pings from the last two hours */
        var now = Date.now();
        $scope.recentPings = _.filter(info.pings,
          ping => now - ping.time.getTime() < 2*60*60*1000)
      })
      .then(null, () => {}) // catch all errors
      .then(() => {
        pingTimer = $timeout(pingLoop, 15000);
      });
    };
    tripPromise.then(pingLoop);
    $scope.$on('$destroy', () => { $timeout.cancel(pingTimer); });

    // Draw the bus stops on the map
    Promise.all([ticketPromise])
    .then(function(values) {
      var ticket = values[0];
      $scope.map.markers.boardStop = ticket.boardStop;
      $scope.map.markers.alightStop = ticket.alightStop;
    });

    // Draw the planned route
    routePromise.then((route) => {
      RoutesService.decodeRoutePath(route.path)
      .then((path) => $scope.map.lines.route.path = path)
      .catch((err) => {
        console.error(err);
      });
    });

    uiGmapGoogleMapApi.then((googleMaps) => {
      $scope.map.busLocation.icon = {
          url: 'img/busMarker.svg',
          scaledSize: new googleMaps.Size(68, 86),
        };
    })

    // Draw the icon for latest bus location
    $scope.$watch('recentPings', function(recentPings) {
      if (recentPings && recentPings.length > 0) {
        var busPosition = recentPings[0].coordinates.coordinates;
        $scope.map.busLocation.coordinates = {
          latitude: busPosition[1],
          longitude: busPosition[0],
        };

        $scope.map.lines.actualPath.path = recentPings.map(ping => ({
          latitude: ping.coordinates.coordinates[1],
          longitude: ping.coordinates.coordinates[0],
        }));
      }
    });

    //
    $scope.$watch('map.markerOptions.boardMarker.icon', (icon) => {
      if (!icon) return;
      tripPromise.then((trip) => {
        for (let ts of trip.tripStops) {
          ts._markerOptions = ts.canBoard ? $scope.map.markerOptions.boardMarker :
                                   $scope.map.markerOptions.alightMarker;
        }
      })
    })

    // Pan and zoom to the bus location when the map is ready
    // Single ping request for updating the map initially
    // Duplicates a bit with the update loop but is much cleaner this way
    // If the load ever gets too much can easily integrate into the
    // main update loop
    var updatePromise = tripPromise.then(function(trip) {
      return TripService.DriverPings(trip.id);
    });
    var mapPromise = new Promise(function(resolve) {
      $scope.$watch('map.control.getGMap', function(getGMap) {
        if (getGMap) resolve($scope.map.control.getGMap());
      });
    });
    Promise.all([
      updatePromise,
      mapPromise,
      ticketPromise,
      uiGmapGoogleMapApi
    ]).then((values) => {
      var [info, map, ticket, googleMaps] = values;

      if (info.pings.length > 0) {
        var bounds = new googleMaps.LatLngBounds();
        bounds.extend(new google.maps.LatLng(ticket.boardStop.stop.coordinates.coordinates[1],
                                             ticket.boardStop.stop.coordinates.coordinates[0]));
        bounds.extend(new google.maps.LatLng(info.pings[0].coordinates.coordinates[1],
                                             info.pings[0].coordinates.coordinates[0]));
        map.fitBounds(bounds);
      }
      else {
        // Just show the boarding stops
        var bounds = new googleMaps.LatLngBounds();
        for (let tripStop of $scope.trip.tripStops) {
          if (!tripStop.canBoard) continue;
          bounds.extend(new google.maps.LatLng(tripStop.stop.coordinates.coordinates[1],
                                               tripStop.stop.coordinates.coordinates[0]));
        }
        map.fitBounds(bounds);
      }
    });

    // ////////////////////////////////////////////////////////////////////////
    // Hack to fix map resizing due to ionic view cacheing
    // Need to use the rootscope since ionic view enter stuff doesnt seem
    // to propagate down to child views and scopes
    // ////////////////////////////////////////////////////////////////////////
    Promise.all([mapPromise, uiGmapGoogleMapApi]).then(function(values) {
      var [map, googleMaps] = values;

      $scope.$on("$ionicView.afterEnter", function(event, data) {
        googleMaps.event.trigger(map, 'resize');
      });
    });

  }
];
