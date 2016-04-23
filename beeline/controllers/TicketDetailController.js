import _ from 'lodash';

export default [
  '$scope',
  '$state',
  '$interval',
  '$stateParams',
  'uiGmapGoogleMapApi',
  'TicketService',
  'CompanyService',
  'TripService',
  'UserService',
  'MapOptions',
  'RoutesService',
  '$timeout',
  function(
    $scope,
    $state,
    $interval,
    $stateParams,
    uiGmapGoogleMapApi,
    TicketService,
    CompanyService,
    TripService,
    UserService,
    MapOptions,
    RoutesService,
    $timeout
  ){

    // Initialize the necessary data
    $scope.user = UserService.user;
    $scope.map = MapOptions.defaultMapOptions();
    $scope.map.lines = [
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
        stroke: { opacity: 0 },
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
    ];
    var ticketPromise = TicketService.getTicketById(+$stateParams.ticketId);
    var tripPromise = ticketPromise.then((ticket) => { 
      return TripService.getTripData(+ticket.alightStop.tripId);
    });
    var routePromise = tripPromise.then((trip) => {
      return RoutesService.getRoute(trip.routeId);
    });
    tripPromise.then((trip) => { $scope.trip = trip; });
    ticketPromise.then((ticket) => { $scope.ticket = ticket; });
    routePromise.then((route) => { $scope.route = route; });

    // Draw the bus stops on the map
    Promise.all([ticketPromise, uiGmapGoogleMapApi])
    .then(function(values) {
      var ticket = values[0];
      var googleMaps = values[1];
      var board = ticket.boardStop.stop.coordinates.coordinates;
      var alight = ticket.alightStop.stop.coordinates.coordinates;
      // Board marker
      $scope.map.markers.push({
        id: 'boardStop',
        coords: { latitude: board[1], longitude: board[0] },
        icon: {
          url: 'img/MapRoutePickupStop@2x.png',
          scaledSize: new googleMaps.Size(25,25),
          anchor: new googleMaps.Point(13,13)
        }
      });
      //Alight marker
      $scope.map.markers.push({
        id: 'alightstop',
        coords: { latitude: alight[1], longitude: alight[0] },
        icon: {
          url: 'img/MapRouteDropoffStop@2x.png',
          scaledSize: new googleMaps.Size(25,25),
          anchor: new googleMaps.Point(13,13)
        }
      });
    });

    // Draw the planned route
    routePromise.then((route) => {
      var routeLine = _.find($scope.map.lines, (line) => {
        return line.id === "routeLine";
      });
      routeLine.path = [];
      _.each(route.path, (point) => {
        routeLine.path.push({
           latitude: point.lat,
           longitude: point.lng
        });
      });
    });

    // Method to draw the bus path and location based on driver pings
    var updateMapWithPings = function() {
      return tripPromise.then(function(trip) {
        return TripService.DriverPings(trip.id);
      })
      .then(function(info) {
        // Draw the bus path
        var busLine = _.find($scope.map.lines, (line) => {
          return line.id === "busLine";
        });
        busLine.path = [];
        _.each(info.pings, function(ping) {
          var latLng = info.pings[i].coordinates.coordinates;
          busLine.path.push({
            latitude: latLng[1],
            longitude: latLng[0]
          });
        });
        // Draw the bus icon
        if (info.pings.length > 0) {
          var busPosition = info.pings[0].coordinates.coordinates;
          var locationIndex = _.findIndex($scope.map.markers, (marker) => {
            marker.id === 'busLocation';
          });
          $scope.map.markers[locationIndex] = {
            id: 'busLocation',
            coords: {
              latitude: busPosition[1],
              longitude: busPosition[0],
            },
            icon: {
              url: 'img/busMarker01.png',
              scaledSize: new googleMaps.Size(80,80),
              anchor: new googleMaps.Point(40,73),
            },
          };
        }
      });
    };

    // Set the pings on a timer every 15s between responses
    // Using a recursive timeout instead of an interval to avoid backlog
    // when the server is slow to respond
    var updateTimer;
    var updateLoopIteration = function(){
      updateMapWithPings().then(function(){
        updateTimer = $timeout(updateLoopIteration, 15000);
      });
    };
    updateLoopIteration();
    // Cleanup timer when view leaves 
    $scope.$on('$destroy', () => { $timeout.cancel(updateTimer); });

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
      mapPromise,
      updatePromise,
      ticketPromise,
      uiGmapGoogleMapApi
    ]).then((values) => {
      var map = values[0];
      var info = values[1];
      var ticket = values[2];
      var googleMaps = values[3];
      if (info.pings.length > 0) {
        var bounds = new googleMaps.LatLngBounds();
        bounds.extend(new google.maps.LatLng(ticket.boardStop.stop.coordinates.coordinates[1],
                                             ticket.boardStop.stop.coordinates.coordinates[0]));
        bounds.extend(new google.maps.LatLng(info.pings[0].coordinates.coordinates[1],
                                             info.pings[0].coordinates.coordinates[0]));
        map.fitBounds(bounds);
      } 
    });

  }
];

// new QRCode(document.getElementById("qr-code-bg"), 'ticket code goes here');
//   $scope.company = compData;
//   $scope.company.logourl = 'http://staging.beeline.sg/companies/'+$scope.company.id+'/logo';
