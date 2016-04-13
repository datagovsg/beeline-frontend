export default [
    '$scope',
    'TicketService',
    'UserService',
    '$ionicModal',
    '$state',
    '$stateParams',
function(
    $scope,
    TicketService,
    UserService,
    $ionicModal,
    $state,
    $stateParams
) {

  $scope.intro = {
	nonetitle: 'No tickets to display.',
	nonemsg: 'You do not have any upcoming trips at the moment!',
	nonebtntxt: 'SEARCH ROUTES',
	falsetitle: 'You are not logged in.',
	falsemsg: 'To view your tickets, log in to your Beeline account!',
	falsebtntxt: 'LOG IN',
  };
  $scope.tickets = {
    today: [],
    soon: []
  }
  $scope.user = null;

  $scope.$on('$ionicView.beforeEnter', () => {
    UserService.getCurrentUser()
    .then((user) => {
      $scope.user = user;
    })

    //user is logged in, load the ticket data
    TicketService.getTickets()
    .then(function () {
      TicketService.splitTickets();
      $scope.tickets.today = TicketService.todayTickets();
      $scope.tickets.soon = TicketService.soonTickets();
    });
  });

  $scope.introBtnClick = () => {
	if ($scope.user == null) {
	  UserService.logIn();
	}
	else {
	  $state.go("tabs.routes.routemap");
	}
  }
}];
