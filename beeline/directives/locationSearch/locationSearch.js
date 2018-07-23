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
            <div class="input-text" ng-if="!location">{{ph}}</div>
            <div class="input-text" ng-if="location">{{location.ADDRESS}}</div>
          </div>
          <i
            ng-show="inputText"
            class="ion-android-close"
            on-tap="clearInput()"
          ></i>
        </div>
      `,
      link (scope, elem, attr) {
        scope.$watch('location', loc => {
          scope.queryLocation = loc
        })

        scope.clearInput = () => {
          scope.inputText = null
          scope.$broadcast('angucomplete-alt:clearInput')
        }

        scope.openSearch = () => {
          $state.go('tabs.search', {
            callback: location => {
              scope.location = location
            },
          })
        }
      },
    }
  }])
