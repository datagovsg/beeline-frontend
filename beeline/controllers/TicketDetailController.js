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
      lines: [
      {
        id: 'busLine',
        path: [],
        stroke: {
          color: '#333',
          opacity: 1.0,
          weight: 3,
        },
      },
      {
        id: 'routeLine',
        path:[],
        stroke: {opacity: 0},
        icons: [{
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 0.5,
            scale: 3
          },
          offset: '0',
          repeat: '20px'
        }]
      }
      ],
      busLocation: {
        coordinates: null,
        icon: null,
      }
    });

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

        for (let ping of info.pings) {
          ping.time = new Date(ping.time);
        }

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
    Promise.all([ticketPromise, uiGmapGoogleMapApi])
    .then(function(values) {
      var ticket = values[0];
      var googleMaps = values[1];
      var board = ticket.boardStop.stop.coordinates.coordinates;
      var alight = ticket.alightStop.stop.coordinates.coordinates;
      $scope.map.markers.push({
        id: 'boardStop',
        coords: {latitude: board[1], longitude: board[0]},
        icon: {
          url: 'img/MapRoutePickupStop.svg',
          scaledSize: new googleMaps.Size(25, 25),
          anchor: new googleMaps.Point(13, 13)
        }
      });
      $scope.map.markers.push({
        id: 'alightstop',
        coords: {latitude: alight[1], longitude: alight[0]},
        icon: {
          url: 'img/MapRouteDropoffStop.svg',
          scaledSize: new googleMaps.Size(25, 25),
          anchor: new googleMaps.Point(13, 13)
        }
      });
    });

    // Draw the planned route
    routePromise.then((route) => {
      var routeLine = _.find($scope.map.lines, {id: 'routeLine'});
      routeLine.path = [];
      _.each(route.path, (point) => {
        routeLine.path.push({
          latitude: point.lat,
          longitude: point.lng
        });
      });
    });

    uiGmapGoogleMapApi.then((googleMaps) => {
      $scope.map.busLocation.icon = {
          url: 'img/busMarker01.png',
          scaledSize: new googleMaps.Size(80, 80),
          anchor: new googleMaps.Point(40, 73),
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

        $scope.map.lines[0].path = recentPings.map(ping => ({
          latitude: ping.coordinates.coordinates[1],
          longitude: ping.coordinates.coordinates[0],
        }));
      }
    });

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
