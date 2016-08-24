export default [
  '$scope',
  'TicketService',
  'UserService',
  'LiteRouteSubscriptionService',
  function(
    $scope,
    TicketService,
    UserService,
    LiteRouteSubscriptionService
  ) {
    // Track the login state of the user service
    $scope.logIn = function() {
      UserService.promptLogIn()
    };
    $scope.$watch(() => UserService.getUser(), (user) => {
      if (user) {
        refreshTickets(true)
      }
      $scope.user = user;
    });

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
      LiteRouteSubscriptionService.getSubscriptions(ignoreCache).then((liteRouteSubscriptions)=>{
        $scope.liteRouteSubscriptions = liteRouteSubscriptions;
        console.log("tickets controller");
        console.log($scope.liteRouteSubscriptions);
        $scope.$broadcast('scroll.refreshComplete');
        $scope.error = false;
      })
      .catch((error) => {
        $scope.$broadcast('scroll.refreshComplete');
        $scope.error = true;
      });;

    }

    $scope.refreshTickets = refreshTickets;
  }
];
