
export default function(cdGmapApi) {

  return {
    template: `
<cd-gmap-circle ng-if="coords" center="coords" radius="radius" style="accuracyOptions"></cd-gmap-circle>
<cd-gmap-marker ng-if="coords" lat-lng="coords" icon="markerOptions.icon"></cd-gmap-marker>
    `,

    scope: true,
    link(scope, elem, attr) {
      scope.coords = null; // Null until location is available
      scope.markerOptions = {
        zIndex: 2
      };
      scope.accuracyOptions = {
        color: '#3E82F7',
        opacity: 0.4,
        weight: 3,
        fillColor: '#3E82F7',
        fillOpacity: 0.2,
      };
      scope.radius = 1;
      scope.idkey1 = `my-location-${Date.now()}-circle`
      scope.idkey2 = `my-location-${Date.now()}-marker`

      cdGmapApi.then((compat) => {
        scope.markerOptions.icon = {
          iconUrl: 'img/userLocation.svg',
          iconAnchor: [6, 6],
        }

        var watch = navigator.geolocation.watchPosition(
          (success) => {
            scope.coords = {
              lat: success.coords.latitude,
              lng: success.coords.longitude,
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
