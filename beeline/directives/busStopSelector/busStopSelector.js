import busStopSelectorTemplate from './busStopSelector.html'
import busStopSelectorListTemplate from './busStopSelectorList.html'
import {formatTime} from '../../shared/format'

export default [
    '$state', '$ionicModal', '$http', 'uiGmapGoogleMapApi', 'MapOptions',
    function ($state, $ionicModal, $http, uiGmapGoogleMapApi, MapOptions) {

  return {
    restrict: 'E',
    replace: true,
    template: busStopSelectorTemplate,
    scope: {
      busStops: '=',
      valueFn: '=value',
      displayFn: '=display',
      displayFn2: '=display2',
      model: "=",
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
      scope.map = MapOptions.defaultMapOptions();

      scope.selectionModal = $ionicModal.fromTemplate(busStopSelectorListTemplate, {
        scope: scope,
        animation: 'slide-in-up',
      });

      scope.showList = function () {
        setTimeout(() => {
            scope.fitMap();
        }, 300);
        window.setStop = scope.setStop;
        scope.selectionModal.show();
      }

      scope.$on('$destroy', () => {
        if (scope.selectionModal) {
          scope.selectionModal.remove();
        }
      });

      scope.formatTime = formatTime;

      scope.fitMap = async () =>  {
        await uiGmapGoogleMapApi;
        MapOptions.disableMapLinks();

        if (!scope.map.control || !scope.busStops ||
                scope.busStops.length == 0)
            return;
        // Pan to the bus stops
        var bounds = new google.maps.LatLngBounds();
        for (let bs of scope.busStops) {
          bounds.extend(new google.maps.LatLng(
              bs.coordinates.coordinates[1],
              bs.coordinates.coordinates[0]));
        }
        scope.map.control.getGMap().fitBounds(bounds);
        if (scope.map.control.getGMap().getZoom() > 17) {
          scope.map.control.getGMap().setZoom(17);
        }
      };

      scope.selectStop = (e, stop) => {
      //prevent firing twice
        if (e.target.tagName == 'INPUT'
            || e.target.tagName == 'BUTTON'
          ) {
          if (stop == scope.selectedStop) {
            scope.model = scope.valueFn(stop);
            scope.selectionModal.hide();
          }
          else {
            scope.selectedStop = stop;
            scope.model = scope.valueFn(stop);
          }
        }
      };
      scope.$watch('selectedStop', function() {
        scope.displayText = scope.selectedStop ? scope.displayFn(scope.selectedStop) : undefined;
      });
      scope.$watchGroup(['model', 'busStops'], scope.selectStopByIndex = function() {
        if (!isFinite(scope.model)) {
          scope.selectedStop = undefined;
          return;
        }
        var selectedIndex = -1;
        for (let i=0; i<scope.busStops.length; i++) {
          if (scope.valueFn(scope.busStops[i]) == scope.model) {
            selectedIndex = i;
            break;
          }
        }
        // NOT SUPPORTED BY EVERY BROWSER?
        // scope.busStops.findIndex(bs =>
        //    scope.valueFn(bs) == scope.model);

        if (selectedIndex != -1) {
          scope.selectedStop = scope.busStops[selectedIndex];
          if (scope.map.control.getGMap) {
            scope.map.control.getGMap().panTo({
              lat: scope.selectedStop.coordinates.coordinates[1],
              lng: scope.selectedStop.coordinates.coordinates[0],
            })
          }
        }
        else {
          scope.selectedStop = undefined;
        }

      });
      scope.selectStopByIndex();

      scope.setStop = function() {
        scope.$apply(() => {
          scope.selectionModal.hide();
        });
      };

      scope.closeStopSelectModal = function() {
        scope.selectionModal.hide();
      };
    },
  };
}];
