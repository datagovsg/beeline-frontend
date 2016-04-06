'use strict';

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
    $scope.UserService = UserService;
    $scope.todaydata = [];
    $scope.soondata = [];
    $scope.TicketService = TicketService;

    $scope.$on('$ionicView.beforeEnter',()=>{

        console.log(UserService.sessionToken);
        if (UserService.sessionToken == undefined){
            UserService.afterLoginGoWhere = $state.current.name;
            $state.go("tabs.settings-login");
            return;
        }
        else {
            $scope.login =true;
        }

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
}];
