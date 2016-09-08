export default function(uiGmapGoogleMapApi, LiteRoutesService) {
  return {
    replace: false,
    template: `
    <ui-gmap-markers  ng-if="tripStops"
                      models="tripStops"
                      idkey="'id'"
                      options="boardMarker"
                      coords="'coordinates'"
                      click="applyTapBoard"
                      ></ui-gmap-markers>
    <ui-gmap-window ng-if="disp.popupStop"
                    coords="disp.popupStop.coordinates"
                    show="disp.popupStop"
                    closeClick="closeWindow">
      <div class="popUpStopSelect">
        <b>{{disp.popupStop.time | formatTimeArray }}</b><br/>
        {{disp.popupStop.description}}<br/>{{disp.popupStop.road}}<br/>
      </div>
    </ui-gmap-window>
    `,
    scope: {
      'todayTrips': '<',
      'mapFrame': '<',
    },
    link: function(scope, element, attributes) {

      scope.disp = {
        popupStop: null,
      }

      uiGmapGoogleMapApi.then((googleMaps) => {
        scope.googleMaps = googleMaps;
        scope.boardMarker = {
          icon: {
            url: 'img/map/MapRoutePickupStop@2x.png',
            scaledSize: new googleMaps.Size(26, 25),
            anchor: new googleMaps.Point(13, 13),
          },
          zIndex: google.maps.Marker.MAX_ZINDEX + 1,
        }
      })

      scope.$watch('todayTrips', (todayTrips) => {
        if (!todayTrips) return;
        scope.tripStops = LiteRoutesService.computeLiteStops(todayTrips);
      })

      scope.$watch('mapFrame', async (mapFrame) => {
        if (!mapFrame) return;
        await scope.tripStops
        panToStops(mapFrame);
      })

      scope.applyTapBoard = function (values) {
        console.log("Tapped");
        console.log(values);
        scope.disp.popupStop = values.model;
        console.log("popup stop is ");
        console.log(scope.disp.popupStop);
        // scope.digest();
      }

      scope.closeWindow = function () {
        scope.disp.popupStop = null;
      }

      function panToStops(mapFrame) {
        var bounds = new scope.googleMaps.LatLngBounds();
        for (let tripStop of scope.tripStops) {
          bounds.extend(new google.maps.LatLng(tripStop.coordinates.coordinates[1],
                                               tripStop.coordinates.coordinates[0]));
        }
        mapFrame.fitBounds(bounds);
      }
    },
  };
}
