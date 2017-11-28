export default [
  "$rootScope",
  function breadcrumbs($rootScope) {
    return {
      template: `<div class="item"><img ng-src="{{breadcrumbs_dir}}{{imgNames[step]}}"></div>`,
      scope: {
        step: "@",
      },
      link: function(scope, elem, attr) {
        scope.breadcrumbs_dir =
          "img/" + $rootScope.o.APP.PREFIX + "booking-breadcrumbs/"
        scope.imgNames = [
          "ProgressBar01_ChooseStops.svg",
          "ProgressBar02_ChooseDates.svg",
          "ProgressBar03_ReviewBooking.svg",
          "ProgressBar04_MakePayment.svg",
        ]
      },
    }
  },
]
