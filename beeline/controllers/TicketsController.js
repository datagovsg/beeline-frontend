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

  var introTxt = {
    noneTitle: 'No tickets to display.',
    noneMsg: 'You do not have any upcoming trips at the moment!',
    noneBtnTxt: 'SEARCH ROUTES',
    falseTitle: 'You are not logged in.',
    falseMsg: 'To view your tickets, log in to your Beeline account!',
    falseBtnTxt: 'LOG IN'
  };

  $scope.intro = {
    title: '',
    msg: '',
    btntxt: '',
  }
  
  $scope.tickets = {
    today: [],
    soon: []
  }
  
  $scope.user = null;

  $scope.$on('$ionicView.beforeEnter', () => {
    UserService.getCurrentUser()
    .then((user) => {
      $scope.user = user;

      if ($scope.user == null) {
        $scope.intro.title = introTxt.falseTitle;
        $scope.intro.msg = introTxt.falseMsg;
        $scope.intro.btntxt = introTxt.falseBtnTxt;
      }
      else {
        $scope.intro.title = introTxt.noneTitle;
        $scope.intro.msg = introTxt.noneMsg;
        $scope.intro.btntxt = introTxt.noneBtnTxt;
      }
    })

    //load ticket data - doesn't matter if user logged in or not
    TicketService.getTickets()
    .then(function () {
      TicketService.splitTickets();
      $scope.tickets.today = TicketService.todayTickets();
      $scope.tickets.soon = TicketService.soonTickets();
    });
  });

  $scope.introButtonClick = () => {
    if ($scope.user == null) {
      UserService.logIn();
    }
    else {
      $state.go("tabs.routes.routemap");
    }
  }
}];
