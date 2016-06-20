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
    $scope.logIn = function() {
      UserService.promptLogIn()
      .then(refreshTickets);
    };

    // Grab the tickets
    $scope.tickets = {};
    $scope.$on('$ionicView.beforeEnter', () => {
      $scope.refreshTickets(true);
    });

    function refreshTickets(ignoreCache) {
      TicketService.getCategorizedTickets(ignoreCache).then((categorizedTickets) => {
        $scope.tickets.today = categorizedTickets.today;
        $scope.tickets.soon = categorizedTickets.afterToday;

        $scope.$broadcast('scroll.refreshComplete');
        $scope.error = false;
      })
      .catch((error) => {
        $scope.$broadcast('scroll.refreshComplete');
        $scope.error = true;
      });
    }

    $scope.refreshTickets = refreshTickets;
  }
];
