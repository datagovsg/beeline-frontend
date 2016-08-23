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
      additionalInfo: '?routeItemAdditionalInfo',
      busNumber: '?routeItemBusNumber',
      startTime: '?routeItemStartTime',
      startLocation: '?routeItemStartLocation',
      endTime: '?routeItemEndTime',
      endLocation: '?routeItemEndLocation',
    },
    link: function(scope, element, attributes) {
    },
  };
}
