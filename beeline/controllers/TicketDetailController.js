'use strict';

export default [
    '$scope',
    '$state',
    '$interval',
    '$stateParams',
    'uiGmapGoogleMapApi',
    'TicketService',
    'CompanyService',
    'TripService',
function(
    $scope,
    $state,
    $interval,
    $stateParams,
    uiGmapGoogleMapApi,
    TicketService,
    CompanyService,
    TripService
){
    $scope.currentState = 'ticket';

    $scope.map = {
		center: { latitude: 1.370244, longitude: 103.823315 },
		zoom: 10,
		mapControl: {},
		events: {},
		options: {
			disableDefaultUI: true,
			styles: [{
				featureType: "poi",
				stylers: [{
					visibility: "off"
				}]
			}]
		},
		markers: [], //pos 0 - bus marker, pos 1 - board stop, 2 - alight stop
		lines: [{
			id: 'buspath',
			path: [],
			stroke: {
				color: '#333',
				opacity: 1.0,
				weight: 3,
			},
			/*
			icons: [{
                icon: {
                    path: 1,
                    scale: 3,
                    strokeColor: '#333'
                },
                offset: '20%',
                repeat: '50px'
            }]
            */
		},{
			id: 'routepath',
			path:[],
			stroke: {
				opacity: 0,
			},
			icons: [{
                icon: {
					path: 'M 0,-1 0,1',
					strokeOpacity: 0.5,
					scale: 3
                },
                offset: '0',
                repeat: '20px'
			}]
		}],
	};

	$scope.user = JSON.parse(localStorage['beelineUser']);
	$scope.tickets = {
		today: [],
		soon: []
	}

	$scope.locator = {
		checkInterval: 8000,
		timePassed: 0,
		timer: '' //placeholder for $interval function
	}

	/*
	$scope.$on('$ionicView.leave',()=>{
		$interval.cancel($scope.locator.timer);
	});
	*/

	var gmap;

    TicketService.getTickets()
        .then((tickets) => {
            $scope.tripTicket = tickets
                    .filter(tick => tick.id == $stateParams.tid)[0];

			//generate QR Code
			new QRCode(document.getElementById("qrcodebg"), 'ticket code goes here');
            return TripService.Trip($scope.tripTicket.alightStop.tripId);
        })
        .then(function(){
            $scope.trip = TripService.gettrip();

			return TripService.RoutePath($scope.trip.routeId);
		})
		.then(function(){
			$scope.route = TripService.getRoutePath();

			return CompanyService.getCompany($scope.trip.transportCompanyId);
        })
        .then(function(compdata){
            $scope.company = compdata;
            $scope.company.logourl = 'http://staging.beeline.sg/companies/'+$scope.company.id+'/logo';

			return uiGmapGoogleMapApi;
		}).then(function(map) {
			console.log("map init success");

			//grabbing the very first bundle of ping data
			return TripService.DriverPings($scope.tripTicket.alightStop.tripId);
		}).then(function(tripinfo) {

			gmap = $scope.map.mapControl.getGMap();

			//re-init the routepath and markers
			$scope.map.lines[1].path = [];
			$scope.map.markers = [];

			//add points for the Route
			for(var i=0; i<$scope.route.path.length; i++)
			{
				$scope.map.lines[1].path.push({
					latitude: $scope.route.path[i].lat,
					longitude: $scope.route.path[i].lng
				});
			}

			//add markers for Bus Stops
			$scope.addBusStops();

			//init the bus marker & bus path
			$scope.updateTripInfo(tripinfo.data);

			//pan and zoom to bus location
			var lastpos = tripinfo.data.pings[0].coordinates.coordinates;
			gmap.panTo(new google.maps.LatLng(lastpos[1], lastpos[0]));
			setTimeout(function(){
				gmap.setZoom(17);
			}, 300);

			//call recurring timer function
			$scope.startPingsRefresh($scope.trip.id);
    });

	$scope.addBusStops = function() {
		var board = $scope.tripTicket.boardStop.stop.coordinates.coordinates;
		var alight = $scope.tripTicket.alightStop.stop.coordinates.coordinates;

		//Board marker
		$scope.map.markers[1] = {
			id: 'boardstop',
			coords: {
				latitude: board[1],
				longitude: board[0],
			},
            icon: {
				url: 'img/icon-stop-big.png',
				scaledSize: new google.maps.Size(25,25),
				anchor: new google.maps.Point(13,25),
			},
		}

		//Alight marker
		$scope.map.markers[2] = {
			id: 'alightstop',
			coords: {
				latitude: alight[1],
				longitude: alight[0],
			},
            icon: {
				url: 'img/icon-marker-big.png',
				scaledSize: new google.maps.Size(25,30),
				anchor: new google.maps.Point(13,30),
			},
		}
	};

	$scope.updateTripInfo = function(updateBundle) {
		console.log('update');

		$scope.map.lines[0].path = []; //buspath

		//redraw polyline on google map - reverse order from end of array to head
		for(var i=updateBundle.pings.length-1; i>=0; i--)
		{
			var latlng = updateBundle.pings[i].coordinates.coordinates;
			$scope.map.lines[0].path.push({
				latitude: latlng[1],
				longitude: latlng[0]
			});
		}

		//redraw bus icon location
		var buspos = updateBundle.pings[0].coordinates.coordinates;
		$scope.map.markers[0] = {
			id: 'busloc',
			coords: {
				latitude: buspos[1],
				longitude: buspos[0],
			},
			icon: {
				url: 'img/map_bus1.png',
				scaledSize: new google.maps.Size(80,80),
				anchor: new google.maps.Point(40,73),
			},
		}


	}

	$scope.startPingsRefresh = function(tripid) {
		console.log('timer start')

		var loc = $scope.locator;
		var refreshbar = document.getElementById('refreshbar');

		loc.timer = $interval(function() {

			//Insurance
			if ($state.current.name != 'tabs.ticket-detail') {
				console.log('timer end');
				$interval.cancel($scope.locator.timer);
			}

			if (loc.timePassed == 0) {
				angular.element(refreshbar).removeClass('reset');
			}

			loc.timePassed += 1000;

			angular.element(refreshbar).css('width', ((loc.timePassed/loc.checkInterval) * 100) + '%');

			if (loc.timePassed > loc.checkInterval)
			{
				loc.timePassed = 0;
				angular.element(refreshbar).addClass('reset');
				angular.element(refreshbar).css('width', '0%');

				TripService.DriverPings(tripid).then(function(tripinfo) {
					$scope.updateTripInfo(tripinfo.data);
				});
			}

			//console.log(loc.timePassed);
		}, 1000);

	}

	$scope.$on('$destroy', () => {
		console.log('timer end');
		$interval.cancel($scope.locator.timer);
    });
}];
