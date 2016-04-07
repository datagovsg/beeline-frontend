'use strict';

export default [
    '$scope',
    'ticketService',
    'userService',
    '$ionicModal',
    '$state',
function(
    $scope,
    ticketService,
    userService,
    $ionicModal,
    $state
) {
    $scope.userService = userService;
    $scope.todaydata = [];
    $scope.soondata = [];
    $scope.ticketService = ticketService;

    $scope.$on('$ionicView.beforeEnter',() => {
        ticketService.getTickets()
        .then(function () {
            ticketService.splitTickets();
            $scope.todaydata = ticketService.todayTickets();
            $scope.soondata = ticketService.soonTickets();
        });

        $scope.setselectedticket = function(tid){
            ticketService.setSelectedTicket(tid);
            $scope.ticket = ticketService.getSelectedTicket();
            console.log("selected ticket is "+$scope.ticket.id);
        }

    });
}];
