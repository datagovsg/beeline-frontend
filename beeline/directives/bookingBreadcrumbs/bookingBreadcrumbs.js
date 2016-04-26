

export default function breadcrumbs() {
  return {
    template:
    `<div class="item"><img src="img/booking-breadcrumbs/{{imgNames[step]}}"></div>`,
    scope: {
      step: '@',
    },
    link: function (scope, elem, attr) {
      scope.imgNames = [
        'ProgressBar01_ChooseStops.svg',
        'ProgressBar02_ChooseDates.svg',
        'ProgressBar03_ReviewBooking.svg',
        'ProgressBar04_MakePayment.svg',
      ]
    }
  }
}
