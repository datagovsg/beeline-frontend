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

    // Initialize the necessary ticket data
    $scope.user = UserService.user;
    $scope.map = MapOptions.defaultMapOptions();
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

    // Method to draw the bus path and location based on driver pings
    var updateMapWithPings = function() {
      return tripPromise.then(function(trip) {
        return TripService.DriverPings(trip.id);
      })
      .then(function(info) {
        // Draw the bus path
        $scope.map.lines[0].path = [];
        _.each(info.pings, function(ping) {
          var latLng = info.pings[i].coordinates.coordinates;
          $scope.map.lines[0].path.push({
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
    // Cleanup timer when view leaves 
    $scope.$on('$destroy', () => { $timeout.cancel(updateTimer); });

    // When the map itself loads pan to the appropriate location
    var mapPromise = new Promise(function(resolve) {
      $scope.$watch('map.control.getGMap', function(getGMap) {
        if (getGMap) resolve($scope.map.control.getGMap());
      });
    });
    mapPromise.then(function(gmap) {});



  
  // 		//generate QR Code
  // new QRCode(document.getElementById("qr-code-bg"), 'ticket code goes here');

  // };


  // }

    // .then(function(compData){
    //   $scope.company = compData;
    //   $scope.company.logourl = 'http://staging.beeline.sg/companies/'+$scope.company.id+'/logo';

  // 		return uiGmapGoogleMapApi;
  // 	}).then(function(map) {
  // 		console.log("map init success");

  //     googleMaps = map;

  // 		//grabbing the very first bundle of ping data
  // 		return TripService.DriverPings($scope.tripTicket.alightStop.tripId);
  // 	}).then(function(tripinfo) {

  // 		$scope.info = tripinfo.data;

  // 		gmap = $scope.map.mapControl.getGMap();

  // 		//re-init the routepath and markers
  // 		$scope.map.lines[1].path = [];
  // 		$scope.map.markers = [];

  // 		//add points for the Route
  // 		for(var i=0; i<$scope.route.path.length; i++)
  // 		{
  // 			$scope.map.lines[1].path.push({
  // 				latitude: $scope.route.path[i].lat,
  // 				longitude: $scope.route.path[i].lng
  // 			});
  // 		}


  // 		//pan and zoom to bus location
  // 		var lastpos = tripinfo.data.pings[0].coordinates.coordinates;
  // 		gmap.panTo(new googleMaps.LatLng(lastpos[1], lastpos[0]));
  // 		setTimeout(function(){
  // 			gmap.setZoom(17);
  // 		}, 300);

  }
];