

export default function breadcrumbs() {
  return {
    template:
    `<div class="item"><img src="img/booking-breadcrumbs/{{imgNames[step]}}"></div>`,
    scope: {
      step: '=',
    },
    link: function (scope, elem, attr) {
      scope.imgNames = [
        'ProgressBar01_ChooseStops.png',
        'ProgressBar02_ChooseDates.png',
        'ProgressBar03_ReviewBooking.png',
        'ProgressBar04_MakePayment.png',
      ]
    }
  }
}
