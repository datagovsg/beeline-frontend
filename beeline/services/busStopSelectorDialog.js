import busStopSelectorListTemplate from '../templates/busStopSelectorList.html';
import {formatTime} from '../shared/format'
import _ from 'lodash';

export default function ($rootScope, $ionicModal, MapOptions, uiGmapGoogleMapApi) {
  var scope = $rootScope.$new();

  initializeScope(scope);
  scope.selectionModal = $ionicModal.fromTemplate(busStopSelectorListTemplate, {
    scope: scope,
    animation: 'slide-in-up',
  });

  this.show = function (options) {
    setTimeout(() => {
      scope.fitMap();
    }, 300);

    _.assign(scope, _.pick(options, [
      'busStops',
      'markerOptions', 'title', 'button', 'pinOptions', 'selectedStop',
    ]))

    return new Promise((resolve, reject) => {
      // Initialize the selected stop
      scope.selectionModal.show();
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

    scope.selectStop = (e, stop) => {
      //prevent firing twice
      if (e.target.tagName == 'INPUT'
          || e.target.tagName == 'BUTTON'
        ) {
        if (stop === scope.selectedStop) {
          scope.close();
        }
        else {
          scope.selectedStop = stop;
        }
      }
    };

    scope.close = () => {
      scope.selectionModal.hide();
      scope.resolve(scope.selectedStop);
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
      else {
        scope.selectedStop = undefined;
      }
    }

    scope.$watch('selectedStop', panToStop);
  }
}
