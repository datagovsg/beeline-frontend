
export default function(uiGmapGoogleMapApi) {

  return {
    template: `
<ui-gmap-circle ng-if="coords" idkey="idkey1" center="coords" radius="radius"
  stroke="accuracyOptions.stroke" fill="accuracyOptions.fill"
  options="accuracyOptions.options"></ui-gmap-circle>
<ui-gmap-marker ng-if="coords" idkey="idkey2" coords="coords" options="markerOptions"></ui-gmap-marker>
    `,

    scope: true,
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
        options: {}
      };
      scope.radius = 1;
      scope.idkey1 = `my-location-${Date.now()}-circle`
      scope.idkey2 = `my-location-${Date.now()}-marker`

      uiGmapGoogleMapApi.then((googleMaps) => {
        scope.markerOptions.icon = {
          url: 'img/userLocation.svg',
          anchor: new googleMaps.Point(6,6),
        }

        var watch = navigator.geolocation.watchPosition(
          (success) => {
            scope.coords = {
              latitude: success.coords.latitude,
              longitude: success.coords.longitude,
            };
            scope.radius = success.coords.accuracy;
            scope.$digest()
          }, (error) => {
            scope.coords = null;
            scope.$digest()
          }, {
            enableHighAccuracy: false,
          });

        scope.$on('destroy', () => {
          navigator.geolocation.clearWatch(watch);
        })
      })
    }
  }
}
