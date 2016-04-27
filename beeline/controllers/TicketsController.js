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
      return UserService.getUser();
    }, function(newUser) {
      $scope.user = newUser;
    });
    $scope.logIn = function() { UserService.promptLogIn(); };

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
