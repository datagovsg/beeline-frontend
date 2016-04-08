'use strict';

export default [
    '$scope',
    'TicketService',
    'UserService',
    '$ionicModal',
    '$state',
function(
    $scope,
    TicketService,
    UserService,
    $ionicModal,
    $state
) {
    $scope.UserService = UserService;
    $scope.TicketService = TicketService;
	$scope.login = {
		status: false,
		introtitle: '',
		intromsg: '',
		introbtntxt: '',
		introbtnurl: '',
		nonetitle: 'No tickets to display.',
		nonemsg: 'You do not have any upcoming trips at the moment!',
		nonebtntxt: 'SEARCH ROUTES',
		nonebtnurl: '',
		falsetitle: 'You are not logged in.',
		falsemsg: 'To view your tickets, log in to your Beeline account!',
		falsebtntxt: 'LOG IN',
		falsebtnurl: ''
	};
	$scope.tickets = {
		today: [],
		soon: []
	}

    $scope.$on('$ionicView.beforeEnter',()=>{

		if (UserService.sessionToken == undefined) //not logged in
		{
			$scope.login.status = false;

			$scope.login.introtitle = $scope.login.falsetitle;
			$scope.login.intromsg = $scope.login.falsemsg;
			$scope.login.introbtntxt = $scope.login.falsebtntxt;
		}
		else //logged in
		{
			$scope.login.status = true;
			
			//user is logged in, load the ticket data
			TicketService.getTickets()
			.then(function () {
				TicketService.splitTickets();
				$scope.tickets.today = TicketService.todayTickets();
				$scope.tickets.soon = TicketService.soonTickets();

				//no current/future tickets to display
				if (($scope.tickets.today.length == 0)&&($scope.tickets.soon.length == 0))
				{
					$scope.login.introtitle = $scope.login.nonetitle;
					$scope.login.intromsg = $scope.login.nonemsg;
					$scope.login.introbtntxt = $scope.login.nonebtntxt;
				}
			});
		}
    });

	$scope.ticketsLogin = function() {
		if ($scope.login.status == false) {
			UserService.afterLoginGoWhere = $state.current.name;
			$state.go("tabs.settings-login");
		}
		else {
			if (($scope.tickets.today.length == 0)&&($scope.tickets.soon.length == 0)) {
				$state.go("tabs.routes.routemap");
			}
		}
	};

	$scope.setselectedticket = function(tid){
		TicketService.setSelectedTicket(tid);
		$scope.ticket = TicketService.getSelectedTicket();
		console.log("selected ticket is "+$scope.ticket.id);
	}
}];
