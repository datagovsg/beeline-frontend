import routeItemTemplate from './routeItem.html';

export default function() {
  return {
    replace: true,
    template: routeItemTemplate,
    controller: function($scope, $state, BookingService){
      $scope.click = function(routeId){
        BookingService.reset();
        BookingService.routeId = routeId;
        $state.go('tabs.booking-pickup');
      };
    }
  };
};
