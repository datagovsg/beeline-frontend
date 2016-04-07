import routeItemTemplate from './routeItem.html';

export default function() {
  return {
    replace: true,
    template: routeItemTemplate,
    controller: function($scope, $state, bookingService){
      $scope.click = function(routeId){
        bookingService.routeId = routeId;
        $state.go('tab.booking-pickup');
      };
    }
  };
};