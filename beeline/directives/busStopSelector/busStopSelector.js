import busStopSelectorTemplate from './busStopSelector.html'
import {formatTime} from '../../shared/format'

export default ['$state', '$ionicModal', '$http', 'uiGmapGoogleMapApi',
  'MapOptions', 'busStopSelectorDialog',
  function ($state, $ionicModal, $http, uiGmapGoogleMapApi, MapOptions,
    busStopSelectorDialog) {
      return {
        restrict: 'E',
        replace: true,
        template: busStopSelectorTemplate,
        scope: {
          busStops: '=',
          ngModel: "=",
          change: '=',
          placeholder: '@',
          title: '@',
          button: '@',
          markerOptions: '=',
          pinOptions: '=',
          ngRequired: '=',
          name: '=',
        },
        link: function (scope, elem, attrs) {
          scope.showList = function () {
            busStopSelectorDialog.show(
              _.assign({selectedStop: scope.ngModel},
                      _.pick(scope, [
                        'busStops', 'markerOptions', 'title', 'button', 'pinOptions'
                      ])))
            .then((selectedStop) => {
              scope.ngModel = selectedStop;
            })
          }

          scope.formatTime = formatTime;
        },
      };
}];
