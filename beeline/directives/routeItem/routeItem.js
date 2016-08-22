import routeItemTemplate from './routeItem.html';

export default function($state, BookingService) {
  return {
    replace: false,
    template: routeItemTemplate,
    scope: {
      route: '=',
    },
    transclude: {
      'company-info': '?routeItemCompanyInfo',
      'schedule-info': '?routeItemScheduleInfo',
    },
    link: function(scope, element, attributes) {
    },
  };
}
