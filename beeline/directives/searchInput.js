angular.module('beeline').directive('searchInput', function () {
  return {
    scope: {
      queryText: '=',
      ph: '@',
      isFiltering: '<',
    },
    template: `
      <div class="search-div item item-icon-left">
        <i class="icon ion-ios-search-strong"></i>
        <input
          type="text"
          ng-model="searchText"
          placeholder="{{ph}}"
          ng-keypress="keypress($event)"
        />
        <ion-spinner ng-show="isFiltering"></ion-spinner>
        <i
          ng-show="!isFiltering && searchText.length > 0"
          class="ion-android-close"
          on-tap="searchText = ''"
        ></i>
      </div>
    `,
    link (scope, elem, attr) {
      scope.$watch('searchText', qt => {
        if (qt || qt === '') {
          scope.queryText = qt.trim()
        }
      })
      scope.keypress = function (e) {
        if (e.key === 'Enter') {
          e.target.blur()
        }
      }
    },
  }
})
