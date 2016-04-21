export default [
  '$scope',
  'TicketService',
  'UserService',
  function(
    $scope,
    TicketService,
    UserService
  ) {

    // Track the login state of the user service
    $scope.$watch(function() {
      return UserService.user;
    }, function(newUser) {
      $scope.user = UserService.user;
    });
    $scope.logIn = function() { UserService.logIn(); };

    $scope.tickets = {
      today: [],
      soon: []
    }

    $scope.$on('$ionicView.beforeEnter', () => {
      TicketService.getTickets()
      .then(function () {
        TicketService.splitTickets();
        $scope.tickets.today = TicketService.todayTickets();
        $scope.tickets.soon = TicketService.soonTickets();
      });
    });

  }
];
