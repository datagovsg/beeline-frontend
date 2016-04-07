'use strict';

export default [
    '$scope',
    '$stateParams',
    'uiGmapGoogleMapApi',
    'TickerService',
    'UserService',
    'CompanyService',
    'TripService',
function(
    $scope,
    $stateParams,
    uiGmapGoogleMapApi,
    TickerService,
    UserService,
    CompanyService,
    TripService
){
    TickerService.getTickets()
        .then((tickets) => {
            $scope.ticket = tickets
                    .filter(tick => tick.id == $stateParams.tid)[0];
            console.log($scope.ticket.boardStop.time)
            TickerService.splitTickets();
            $scope.todaydata = TickerService.todayTickets();
            $scope.soondata = TickerService.soonTickets();
            return TripService.Trip($scope.ticket.id)
        })
        .then(function(){
            $scope.trip = TripService.gettrip();
            return CompanyService.Company($scope.trip.transportCompanyId)
        })
        .then(function(){
            $scope.company = CompanyService.getcompany();
        })

    $scope.UserService = UserService;

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
