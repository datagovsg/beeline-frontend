angular.module('beeline').directive('locationSearch', [
  '$state', '$timeout',
  function ($state, $timeout) {
    return {
      scope: {
        queryLocation: '=',
        ph: '@',
        isFiltering: '<',
        icon: '@',
        inputId: '=',
      },
      template: `
        <div class="location-search item item-icon-left">
          <i class="icon pickup-stop" ng-if="icon === 'pickup'"></i>
          <i class="icon dropoff-stop" ng-if="icon === 'dropoff'"></i>
          <div class="input-box" on-tap="openSearch()">
            <div class="input-text" ng-if="!queryLocation">{{ph}}</div>
            <div class="input-text" ng-if="queryLocation">{{queryLocation.ADDRESS}}</div>
          </div>
          <ion-spinner ng-show="isFiltering"></ion-spinner>
          <i
            ng-show="!isFiltering && queryLocation"
            class="ion-android-close"
            on-tap="clearInput()"
          ></i>
        </div>
      `,
      link (scope, elem, attr) {
        scope.clearInput = () => {
          scope.queryLocation = null
          scope.isFiltering = true
          $timeout(() => {
            scope.isFiltering = false
          }, 1000)
        }

        scope.openSearch = () => {
          $state.go('tabs.search', {
            type: scope.icon,
            location: scope.queryLocation,
            callback: location => {
              scope.queryLocation = location
            },
          })
        }
      },
    }
  }])
