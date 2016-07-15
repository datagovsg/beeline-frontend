
export default function(uiGmapGoogleMapApi) {

  return {
    template: `
<ui-gmap-circle ng-if="coords" idkey="idkey" center="coords" radius="radius"
  stroke="accuracyOptions.stroke" fill="accuracyOptions.fill"
  options="accuracyOptions.options"></ui-gmap-circle>
<ui-gmap-marker ng-if="coords" idkey="idkey" coords="coords" options="markerOptions"></ui-gmap-marker>
    `,

    scope: {
      idkey: '=?',
    },
    link(scope, elem, attr) {
      scope.coords = null; // Null until location is available
      scope.markerOptions = {
        zIndex: 2
      };
      scope.accuracyOptions = {
        stroke: {
          color: '#3E82F7',
          opacity: 0.4,
          weight: 1
        },
        fill: {
          color: '#3E82F7',
          opacity: 0.2,
        },
        options: {
          zIndex: 1
        }
      };
      scope.radius = 1;
      scope.idkey = `my-location-${Date.now()}`

      uiGmapGoogleMapApi.then((googleMaps) => {
        scope.markerOptions.icon = {
          url: 'img/userLocation.svg',
          anchor: new googleMaps.Point(12,12),
        }
      })

      var watch = navigator.geolocation.watchPosition(
        (success) => {
          scope.coords = {
            latitude: success.coords.latitude,
            longitude: success.coords.longitude,
          };
          scope.radius = success.coords.accuracy;
          scope.$digest(); // FIXME or apply?
        }, (error) => {
          scope.coords = null;
          scope.$digest();
        }, {
          enableHighAccuracy: false,
        });

      scope.$on('destroy', () => {
        navigator.geolocation.clearWatch(watch);
      })
    }
  }
}
