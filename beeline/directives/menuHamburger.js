angular.module("beeline").directive("menuHamburger", function() {
  return {
    replace: false,
    template: `
    <button menu-toggle="left" class="button button-icon">
      <span class="fa-stack">
        <span class="fa-stack-1x filetype-text">MENU</span>
        <i class="fa fa-bars fa-stack-1x"></i>
      </span>
    </button>
    `,
  }
})
