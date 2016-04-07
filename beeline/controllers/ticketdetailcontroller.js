'use strict';

export default [
    '$scope',
    '$stateParams',
    'uiGmapGoogleMapApi',
    'ticketService',
    'userService',
    'companyService',
    'tripService',
function(
    $scope,
    $stateParams,
    uiGmapGoogleMapApi,
    ticketService,
    userService,
    companyService,
    tripService
){
    ticketService.getTickets()
        .then((tickets) => {
            $scope.ticket = tickets
                    .filter(tick => tick.id == $stateParams.tid)[0];
            console.log($scope.ticket.boardStop.time)
            ticketService.splitTickets();
            $scope.todaydata = ticketService.todayTickets();
            $scope.soondata = ticketService.soonTickets();
            return tripService.Trip($scope.ticket.id)
        })
        .then(function(){
            $scope.trip = tripService.gettrip();
            return companyService.Company($scope.trip.transportCompanyId)
        })
        .then(function(){
            $scope.company = companyService.getcompany();
        })

    $scope.userService = userService;

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
		}
	};

    uiGmapGoogleMapApi.then(function(map) {
        console.log("success");
    });
}];
