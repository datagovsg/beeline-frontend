angular.module('beeline').directive('menuHamburger', function () {
  return {
    replace: false,
    template: `
    <button menu-toggle="left" class="button button-icon icon ion-navicon"></button>
    `,
  }
})
