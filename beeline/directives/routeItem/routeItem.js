import routeItemTemplate from './routeItem.html';

export default ['$state', 'BookingService',
function($state, BookingService) {
  return {
    replace: false,
    template: routeItemTemplate,
    scope: {
      hideBusLabel: '<?',
      hideAdditionalInfo: '<?',
      hideTiming: '<?',
      hideDescription: '<?',
    },
    transclude: {
      additionalInfo: '?routeItemAdditionalInfo',
      busNumber: '?routeItemBusNumber',
      startTime: '?routeItemStartTime',
      startLocation: '?routeItemStartLocation',
      endTime: '?routeItemEndTime',
      endLocation: '?routeItemEndLocation',
      description: '?routeItemDescription',
    },
    link: function(scope, element, attributes) {
    },
  };
}]
