
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

      //no current/future tickets to display
      if (($scope.tickets.today.length == 0)&&($scope.tickets.soon.length == 0))
      {
        $scope.login.introtitle = $scope.login.nonetitle;
        $scope.login.intromsg = $scope.login.nonemsg;
        $scope.login.introbtntxt = $scope.login.nonebtntxt;
      }
    });
  });

  $scope.setselectedticket = function(tid) {
  }

  $scope.logIn = () => UserService.logIn();
}];
