import busStopSelectorListTemplate from '../templates/busStopSelectorList.html';
import {formatTime} from '../shared/format'
import _ from 'lodash';

export default ['$rootScope', '$ionicModal', 'MapOptions',
  'uiGmapGoogleMapApi', '$ionicScrollDelegate',
  function($rootScope, $ionicModal, MapOptions, uiGmapGoogleMapApi, $ionicScrollDelegate) {
    var scope = $rootScope.$new();

    initializeScope(scope);
    scope.selectionModal = $ionicModal.fromTemplate(busStopSelectorListTemplate, {
      scope: scope,
      animation: 'slide-in-up',
    });

    this.show = function (options) {
      _.assign(scope, _.pick(options, [
        'busStops', 'markerOptions', 'title', 'button', 'pinOptions',
      ]))
      scope.data.selectedStop = options.selectedStop;

      return new Promise((resolve, reject) => {
        // Initialize the selected stop
        scope.selectionModal.show()
        .then(() => {
          scope.fitMap();

          // I have no idea why $getByHandle doesn't work in Ionic 1.3.1
          // var scrollDelegate = $ionicScrollDelegate.$getByHandle('stopsListScroll');
          var scrollDelegate = $ionicScrollDelegate._instances.find(inst => inst.$$delegateHandle === 'stopsListScroll');
          scrollDelegate.resize();
          scrollDelegate.scrollTop();
        });
        scope.resolve = resolve;
      })
    }

    /**
      Initializes properties and methods on scope

      @prop map
      @method fitMap
      @method selectStop -- fired when tapping on a stop in the list
      @method close -- closes the modal
    **/
    function initializeScope(scope) {
      scope.data = {};
      scope.map = MapOptions.defaultMapOptions();

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

      scope.close = () => {
        scope.selectionModal.hide();
        scope.resolve(scope.data.selectedStop);
      }

      function panToStop(stop) {
        if (!stop) {
          return;
        }
        if (scope.map.control.getGMap) {
          scope.map.control.getGMap().panTo({
            lat: stop.coordinates.coordinates[1],
            lng: stop.coordinates.coordinates[0],
          })
        }
      }

      // BECAUSE ANGULAR SCOPES ARE STUPID
      scope.$watch('data.selectedStop', (stop) => {
        panToStop(stop);
      });
    }
}]
