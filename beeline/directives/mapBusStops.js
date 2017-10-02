export default function(cdGmapApi, LiteRoutesService, uiGmapCtrlHandle) {
  return {
    replace: false,
    require: '^uiGmapGoogleMap',
    template: `
    <cd-gmap-marker
      ng-repeat="stop in tripStops track by stop.id"
      lat-lng="stop.coordinates | geojsonToLatLng"
      icon="stop.canBoard ? boardMarker.icon : alightMarker.icon"
      click="applyTapBoard(stop)"
    ></ui-gmap-marker>
    <cd-gmap-info-window ng-if="disp.popupStop"
                    coords="disp.popupStop.coordinates"
                    show="disp.popupStop"
                    closeClick="closeWindow">
      <div class="popUpStopSelect">
        <b ng-if="!isLiteFrequent">{{disp.popupStop.time | formatTimeArray }}<br/></b>
        {{disp.popupStop.description}}<br/>{{disp.popupStop.road}}<br/>
      </div>
    </cd-gmap-info-window>
    `,
    scope: {
      'availableTrips': '<',
      'isLiteFrequent': '<?',
    },
    link: function(scope, element, attributes, ctrl) {

      scope.disp = {
        popupStop: null,
      }

      cdGmapApi.then(() => {
        const googleMaps = google.maps
        scope.googleMaps = googleMaps;
        scope.boardMarker = {
          icon: {
            iconUrl: 'img/map/MapRoutePickupStop@2x.png',
            iconSize: [26, 25],
            iconAnchor: [13, 13],
          },
          zIndex: google.maps.Marker.MAX_ZINDEX + 1,
        }
        scope.alightMarker = {
          icon: {
            iconUrl: 'img/map/MapRouteDropoffStop@2x.png',
            iconSize: [26, 25],
            iconAnchor: [13, 13],
          },
          zIndex: google.maps.Marker.MAX_ZINDEX + 1,
        }
      })

      scope.$watch('availableTrips', (availableTrips) => {
        if (!availableTrips || availableTrips.length==0) return;
        scope.tripStops = LiteRoutesService.computeLiteStops(availableTrips);
        uiGmapCtrlHandle.mapPromise(scope, ctrl).then(panToStops);
      })

      scope.applyTapBoard = function (stop) {
        scope.disp.popupStop = stop;
      }

      scope.closeWindow = function () {
        scope.disp.popupStop = null;
      }

      function panToStops(map) {
        google.maps.event.trigger(map, 'resize')
        map.fitBounds(scope.tripStops.map(s => [
          s.coordinates.coordinates[1],
          s.coordinates.coordinates[0]
        ]));
      }
    },
  };
}
