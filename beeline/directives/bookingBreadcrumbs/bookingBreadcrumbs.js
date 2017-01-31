

export default function breadcrumbs($rootScope) {
  return {
    template:
    `<div class="item"><img ng-src="img/booking-breadcrumbs/{{imgNames[step]}}"></div>`,
    scope: {
      step: '@',
    },
    link: function(scope, elem, attr) {
      scope.imgNames = [];
      if($rootScope.o.app && $rootScope.o.app.prefix) {
        scope.imgNames = [
          $rootScope.o.app.prefix+'_ProgressBar01_ChooseStops.svg',
          $rootScope.o.app.prefix+'_ProgressBar02_ChooseDates.svg',
          $rootScope.o.app.prefix+'_ProgressBar03_ReviewBooking.svg',
          $rootScope.o.app.prefix+'_ProgressBar04_MakePayment.svg',
        ];
      }
      else {
        scope.imgNames = [
          'ProgressBar01_ChooseStops.svg',
          'ProgressBar02_ChooseDates.svg',
          'ProgressBar03_ReviewBooking.svg',
          'ProgressBar04_MakePayment.svg',
        ];
      }

    }
  };
}
