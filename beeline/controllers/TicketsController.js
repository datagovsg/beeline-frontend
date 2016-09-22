export default [
  '$scope',
  'TicketService',
  'UserService',
  'LiteRouteSubscriptionService',
  'LiteRoutesService',
  'loadingSpinner',
  function(
    $scope,
    TicketService,
    UserService,
    LiteRouteSubscriptionService,
    LiteRoutesService,
    loadingSpinner,
  ) {
    var normalRoutesPromise = Promise.resolve(null);;
    var liteRoutesPromise = Promise.resolve(null);

    // Track the login state of the user service
    $scope.logIn = function() {
      UserService.promptLogIn()
    };

    $scope.$watch(() => UserService.getUser() && UserService.getUser().id, () => {
      refreshTickets(true);
      $scope.user = UserService.getUser();
    });

    // Grab the tickets
    $scope.tickets = {};

    $scope.$on('$ionicView.afterEnter', () => {
      loadingSpinner(Promise.all([normalRoutesPromise, liteRoutesPromise]));
    });

    $scope.$watch(() => TicketService.getShouldRefreshTickets(), (value) => {
      if (!value) return;
      normalRoutesPromise = refreshNormalTickets(true);
    })
    $scope.$watch(() => LiteRoutesService.getShouldRefreshLiteTickets(), (value) => {
      if (!value) return;
      liteRoutesPromise = refreshLiteTickets(true);
    })

    function refreshTickets(ignoreCache) {
      normalRoutesPromise = refreshNormalTickets(ignoreCache)
      liteRoutesPromise = refreshLiteTickets(ignoreCache)
    }

    function refreshNormalTickets(ignoreCache) {
      return TicketService.getCategorizedTickets(ignoreCache).then((categorizedTickets) => {
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

    function refreshLiteTickets(ignoreCache) {
      LiteRoutesService.clearShouldRefreshLiteTickets();
      return LiteRouteSubscriptionService.getSubscriptions(ignoreCache).then(async(liteRouteSubscriptions)=>{
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
