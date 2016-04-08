'use strict';

export default [
    '$scope',
    '$interval',
    '$stateParams',
    'uiGmapGoogleMapApi',
    'TicketService',
    'CompanyService',
    'TripService',
function(
    $scope,
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
		markers: [],
		lines: [{
			id: 'buspath',
			path: [
			{
				latitude: 1.265426,
				longitude: 103.822106
			}, {
				latitude: 1.319582,
				longitude: 103.902807
			}
			],
			icons: [{
                icon: {
                    path: 1,
                    scale: 3,
                    strokeColor: '#333'
                },
                offset: '20%',
                repeat: '50px'
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
            $scope.ticket = tickets
                    .filter(tick => tick.id == $stateParams.tid)[0];
            
			//generate QR Code
			new QRCode(document.getElementById("qrcodebg"), 'ticket code goes here');
            return TripService.Trip($scope.ticket.alightStop.tripId);
        })
        .then(function(){
            $scope.trip = TripService.gettrip();
			return CompanyService.Company($scope.trip.transportCompanyId);
        })
        .then(function(){
            $scope.company = CompanyService.getcompany();
            $scope.company.logourl = 'http://staging.beeline.sg/companies/'+$scope.company.id+'/logo';

			//grab the driver name and vehicle plate no
			return TripService.DriverPings($scope.ticket.alightStop.tripId);
		})
        .then(function(){

			return uiGmapGoogleMapApi;
		}).then(function(map) {
			console.log("map init success");

			gmap = $scope.map.mapControl.getGMap();

			$scope.updateTripInfo();

			//call recurring timer function
			$scope.startPingsRefresh($scope.trip.id);
    });

	$scope.updateTripInfo = function() {
		console.log('update');

		//grab latest info
		$scope.info = TripService.getDriverPings();		

		//console.log($scope.info);

		$scope.map.lines[0].path = [];
		$scope.map.markers = [];

		//redraw polyline on google map
		for(var i=0; i< $scope.info.pings.length; i++)
		{
			var latlng = $scope.info.pings[i].coordinates.coordinates;
			$scope.map.lines[0].path.push({
				latitude: latlng[1],
				longitude: latlng[0]
			});
		}
	}

	$scope.startPingsRefresh = function(tripid) {
		console.log('timer start')

		var loc = $scope.locator;

		loc.timer = $interval(function() {
			
			loc.timePassed += 1000;
			if (loc.timePassed >= loc.checkInterval)
			{
				loc.timePassed = 0;

				$scope.updateTripInfo();
//FIX ME - add timer bar below bus message
			}

			console.log(loc.timePassed);
		}, 1000);

	}

	$scope.$on('$destroy', () => {
		$interval.cancel($scope.locator.timer);
    });
}];
