
export default [
    '$scope',
    'TicketService',
    'UserService',
    '$ionicModal',
    '$state',
function(
    $scope,
    TicketService,
    UserService,
    $ionicModal,
    $state
) {
  $scope.todaydata = [];
  $scope.soondata = [];
  $scope.user = null;

  $scope.$on('$ionicView.beforeEnter',()=>{
    UserService.getCurrentUser()
    .then((user) => {
      $scope.user = user;
    })

    TicketService.getTickets()
    .then(function () {
      TicketService.splitTickets();
      $scope.todaydata = TicketService.todayTickets();
      $scope.soondata = TicketService.soonTickets();
    });

    $scope.setselectedticket = function(tid){
      TicketService.setSelectedTicket(tid);
      $scope.ticket = TicketService.getSelectedTicket();
      console.log("selected ticket is "+$scope.ticket.id);
    }
  });

  $scope.logIn = () => UserService.logIn();
}];
