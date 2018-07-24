angular.module('beeline').directive('locationSearch', [
  '$state',
  function ($state) {
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
          <i
            ng-show="queryLocation"
            class="ion-android-close"
            on-tap="clearInput()"
          ></i>
        </div>
      `,
      link (scope, elem, attr) {
        scope.clearInput = () => {
          scope.queryLocation = null
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
