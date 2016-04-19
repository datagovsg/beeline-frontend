import busStopSelectorTemplate from './busStopSelector.html'
import busStopSelectorListTemplate from './busStopSelectorList.html'
export default [
    '$state',
    '$ionicModal',
    '$http',
    'uiGmapGoogleMapApi'
  , function (
    $state,
    $ionicModal,
    $http,
    uiGmapGoogleMapApi
    ) {

  return {
    restrict: 'E',
    transclude: true,
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
    },
    link: function (scope, elem, attrs) {
      scope.map = {
        center: { latitude: 1.370244, longitude: 103.823315 },
        zoom: 11,
        bounds: { //so that autocomplete will mainly search within Singapore
          northeast: {
            latitude: 1.485152,
            longitude: 104.091837
          },
          southwest: {
            latitude: 1.205764,
            longitude: 103.589899
          }
        },
        mapControl: {},
        options: {
          disableDefaultUI: true,
          styles: [{
            featureType: "poi",
            stylers: [{
              visibility: "off"
            }]
          }],
          draggable: true
        },
        markers: [],
        lines: [],
      };

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

      elem[0].firstChild.querySelector('.stop-description')
          .addEventListener('focus', scope.showList)

      scope.$on('$destroy', () => {
        if (scope.selectionModal) {
          scope.selectionModal.remove();
        }
      });

      scope.fitMap = async () =>  {
          await uiGmapGoogleMapApi;

          //Disable the Google link at the bottom left of the map
          var glink = angular.element(document.getElementsByClassName("gm-style-cc"));
          glink.next().find('a').on('click', function (e) {
            e.preventDefault();
          });

          if (!scope.map.mapControl || !scope.busStops ||
                  scope.busStops.length == 0)
                  return;

          // Pan to the bus stops
          var bounds = new google.maps.LatLngBounds();
          for (let bs of scope.busStops) {
              bounds.extend(new google.maps.LatLng(
                  bs.coordinates.coordinates[1],
                  bs.coordinates.coordinates[0]));
          }

          scope.map.mapControl.getGMap().fitBounds(bounds);
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
      scope.$watch('model', scope.selectStopByIndex = function() {
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
        }
        else {
            scope.selectedStop = undefined;
        }

        if (scope.map.mapControl.getGMap) {
          scope.map.mapControl.getGMap().panTo({
            lat: scope.selectedStop.coordinates.coordinates[1],
            lng: scope.selectedStop.coordinates.coordinates[0],
          })
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
