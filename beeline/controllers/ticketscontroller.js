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

    $scope.$on('$ionicView.beforeEnter',()=>{

        console.log(userService.sessionToken);
        if (userService.sessionToken == undefined){
            userService.afterLoginGoWhere = $state.current.name;
            $state.go("tab.settings-login");
            return;
        }
        else {
            $scope.login =true;
        }

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
