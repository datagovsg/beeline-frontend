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
    RoutesService
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


    var mapPromise = new Promise(function(resolve) {
      $scope.$watch('map.control.getGMap', function(getGMap) {
        if (getGMap) resolve($scope.map.control.getGMap());
      });
    });
    mapPromise.then(function(gmap) {});

    // $scope.$watch('map.control.getGMap', function(getGMap) {
    // });
    // uiGmapGoogleMapApi.then(function(googleMaps) {

    // });

     




    // // Update with the driver Pings
    // TripService.DriverPings(tripid)
    // .then(function(info) {

    //   // Draw the bus path
    //   $scope.map.lines[0].path = [];
    //   _.each($scope.info.pings, function(ping) {
    //     var latLng = info.pings[i].coordinates.coordinates;
    //     $scope.map.lines[0].path.push({
    //       latitude: latLng[1],
    //       longitude: latLng[0]
    //     });
    //   });

    //   // Draw the bus icon
    //   var busPosition = info.pings[0].coordinates.coordinates;
    //   $scope.map.markers[0] = {
    //      id: 'busLocation',
    //      coords: {
    //        latitude: busPosition[1],
    //        longitude: busPosition[0],
    //      },
    //      icon: {
    //        url: 'img/busMarker01.png',
    //        scaledSize: new googleMaps.Size(80,80),
    //        anchor: new googleMaps.Point(40,73),
    //      },
    //    };

    // });


  
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

  // 		//add markers for Bus Stops
  // 		addBusStops();

  // 		//init the bus marker & bus path
  // 		updateTripInfo();

  // 		//pan and zoom to bus location
  // 		var lastpos = tripinfo.data.pings[0].coordinates.coordinates;
  // 		gmap.panTo(new googleMaps.LatLng(lastpos[1], lastpos[0]));
  // 		setTimeout(function(){
  // 			gmap.setZoom(17);
  // 		}, 300);

  // 		//call recurring timer function
  // 		startPingsRefresh($scope.trip.id);
  //   });

  //   $scope.$on('$destroy', () => {
  // 	 console.log('timer end');
  // 	 $interval.cancel($scope.locator.timer);
  //   });
  }
];