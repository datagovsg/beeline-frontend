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
    });
  });

  $scope.logIn = () => UserService.logIn();
}];
