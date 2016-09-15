export default [
  '$scope',
  'TicketService',
  'UserService',
  'LiteRouteSubscriptionService',
  'LiteRoutesService',
  function(
    $scope,
    TicketService,
    UserService,
    LiteRouteSubscriptionService,
    LiteRoutesService
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
      LiteRouteSubscriptionService.getSubscriptions(ignoreCache).then(async(liteRouteSubscriptions)=>{
          // $scope.liteRouteSubscriptions = [];

          var XXX = []
          for (let subscribedLiteLabel of liteRouteSubscriptions) {
            var subscribedLiteRoute = await LiteRoutesService.getLiteRoute(subscribedLiteLabel)
            XXX.push({"label": subscribedLiteLabel,"liteRoute": subscribedLiteRoute})
          }
          $scope.liteRouteSubscriptions = XXX;
          $scope.$broadcast('scroll.refreshComplete');
          $scope.error = false;
        })
        .catch((error) => {
          console.log(error.stack);
          $scope.$broadcast('scroll.refreshComplete');
          $scope.error = true;
        });

    }

    $scope.refreshTickets = refreshTickets;
  }
];
