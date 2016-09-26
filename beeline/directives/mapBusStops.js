export default function(uiGmapGoogleMapApi, LiteRoutesService, uiGmapCtrlHandle) {
  return {
    replace: false,
    require: '^uiGmapGoogleMap',
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
        <b ng-if="!isLiteFrequent">{{disp.popupStop.time | formatTimeArray }}</b><br ng-if="!isLiteFrequent"/>
        {{disp.popupStop.description}}<br/>{{disp.popupStop.road}}<br/>
      </div>
    </ui-gmap-window>
    `,
    scope: {
      'availableTrips': '<',
      'isLiteFrequent': '<?',
    },
    link: function(scope, element, attributes, ctrl) {

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

      scope.$watch('availableTrips', (availableTrips) => {
        if (!availableTrips) return;
        scope.tripStops = LiteRoutesService.computeLiteStops(availableTrips);
        uiGmapCtrlHandle.mapPromise(scope, ctrl).then(panToStops);
      })

      scope.applyTapBoard = function (values) {
        scope.disp.popupStop = values.model;
        // scope.digest();
      }

      scope.closeWindow = function () {
        scope.disp.popupStop = null;
      }

      function panToStops(map) {
        var bounds = new scope.googleMaps.LatLngBounds();
        for (let tripStop of scope.tripStops) {
          bounds.extend(new google.maps.LatLng(tripStop.coordinates.coordinates[1],
                                               tripStop.coordinates.coordinates[0]));
        }
        google.maps.event.trigger(map, 'resize')
        map.fitBounds(bounds);
      }
    },
  };
}
