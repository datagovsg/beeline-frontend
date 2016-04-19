import routeItemTemplate from './routeItem.html';

export default function($state, BookingService) {
  return {
    replace: false,
    template: routeItemTemplate,
    scope: {
      route: '=',
    },
    link: function (scope, element, attributes) {
    },
  };
};
