import routeItemTemplate from './routeItem.html';

export default function($state, BookingService) {
  return {
    replace: false,
    template: routeItemTemplate,
    scope: {
      route: '=',
    },
    link: function (scope, element, attributes) {
      // scope.click = function(routeId){
      //   BookingService.reset();
      //   BookingService.routeId = routeId;
      //   $state.go('tabs.booking-pickup');
      // };
    },
  };
};
