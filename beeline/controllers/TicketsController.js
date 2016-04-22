export default [
  '$scope',
  'TicketService',
  'UserService',
  function(
    $scope,
    TicketService,
    UserService
  ) {
    console.log('here in tickets controller');

    // Track the login state of the user service
    $scope.$watch(function() {
      return UserService.user;
    }, function(newUser) {
      $scope.user = UserService.user;
    });
    $scope.logIn = function() { UserService.logIn(); };

    // Grab the tickets
    $scope.tickets = {};
    $scope.$on('$ionicView.beforeEnter', () => {
      TicketService.getCategorizedTickets(true).then((categorizedTickets) => {
        $scope.tickets.today = categorizedTickets.today;
        $scope.tickets.soon = categorizedTickets.afterToday;
      });
    });

  }
];
