import locationSelectModalTemplate from '../../templates/location-select-modal.html'

angular.module('beeline').directive('locationSearch', [
  '$state', '$timeout', '$rootScope', '$ionicModal',
  function ($state, $timeout, $rootScope, $ionicModal) {
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
            <div class="input-text placeholder" ng-if="!queryLocation">{{ph}}</div>
            <div class="input-text" ng-if="queryLocation">{{queryLocation.ADDRESS}}</div>
          </div>
          <ion-spinner ng-show="isFiltering && queryLocation"></ion-spinner>
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
          scope.initSearchModal().show()
        }

        scope.initSearchModal = () => {
          let modalScope = $rootScope.$new()
          modalScope.queryLocation = scope.queryLocation
          modalScope.type = scope.icon
          modalScope.location = scope.queryLocation
          modalScope.callback = async location => {
            scope.queryLocation = await location
          }
          let modal = $ionicModal.fromTemplate(locationSelectModalTemplate, {
            scope: modalScope,
            animation: 'slide-in-up',
          })
          modalScope.modal = modal
          return modal
        }
      },
    }
  }])
