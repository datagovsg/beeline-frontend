
angular.module('beeline').directive('searchInput', function () {
  return {
    scope: {
      queryText: '=',
      ph: '@',
      isFiltering: '<',
    },
    template: `
      <div class="search-div">
        <label class="search item item-input">
          <i class="icon ion-ios-search-strong"></i>
          <input
            id="search"
            type="text"
            ng-model="searchText"
            placeholder="{{ph}}"
          />
          <ion-spinner ng-show="isFiltering"></ion-spinner>
          <i
            class="icon ion-android-close"
            on-tap="searchText = ''"
            ng-show="searchText.length > 0"
          ></i>
        </label>
      </div>
    `,
    link(scope, elem, attr) {
      scope.$watch('searchText' , (qt) => {
        if(!qt || qt.trim().length < 3) {
          scope.queryText = ""
        } else {
          scope.queryText = qt.trim()
        }
      })
    }
  }
})
