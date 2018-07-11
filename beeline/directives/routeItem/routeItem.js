import routeItemTemplate from './routeItem.html'

angular.module('beeline').directive('routeItem', [
  function () {
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
      link: function (scope, element, attributes) {},
    }
  },
])
