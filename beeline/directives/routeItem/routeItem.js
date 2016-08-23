import routeItemTemplate from './routeItem.html';

export default function($state, BookingService) {
  return {
    replace: false,
    template: routeItemTemplate,
    scope: {
      hideBusLabel: '<?',
      hideAdditionalInfo: '<?'
    },
    transclude: {
      'additional-info': '?routeItemAdditionalInfo',
      'bus-number': '?routeItemBusNumber',
      'start-time': '?routeItemStartTime',
      'start-location': '?routeItemStartLocation',
      'end-time': '?routeItemEndTime',
      'end-location': '?routeItemEndLocation',
    },
    link: function(scope, element, attributes) {
    },
  };
}
