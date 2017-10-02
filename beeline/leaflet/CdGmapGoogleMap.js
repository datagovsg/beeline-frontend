import {
  propsToAngularProps, optionsFromProps, setUpWatchers, setUpEvents
} from './util.js'
import * as L from 'leaflet'

const props = {
  'center': {
    jsSet(obj, value) {
      obj.panTo(value)
    }
  },
  'zoom': {},
}

const events = [
  'click',
  'dblclick',
  'drag',
  'dragend',
  'dragstart',
  'idle',
  'mousemove',
  'mouseout',
  'mouseover',
  'resize',
  'rightclick',
  'tilesloaded',
]

angular.module('cdGmap')
.directive('cdGmapGoogleMap',
['cdGmapSettings', 'cdGmapApi',
function (cdGmapSettings, cdGmapApi) {
  return {
    restrict: 'E',

    template: `
  <div class="cd-google-map">
  </div>
  <div ng-hide>
    <ng-transclude></ng-transclude>
  </div>
    `,

    transclude: true,
    // replace: true,

    scope: {
      ...propsToAngularProps(props, events),
      control: '=',
    },

    link (scope, elem, attrs) {
      scope.$installMap(elem)
    },

    controller ($scope) {
      this.$mapPromise = new Promise((resolve, reject) => {
        $scope.$installMap = (elem) => {
          const domElement = elem[0].querySelector('.cd-google-map')

          if (cdGmapSettings.useNativeMaps) {
            throw new Error("Native maps not implemented")
          } else {
            // Provide users with the map promise so they know when
            // the map has been loaded

            const mapPromise = cdGmapApi.then(() => {
              const options = optionsFromProps(props, $scope)

              $scope.$mapObject = new L.map(
                domElement,
                {center: options.center, zoom: options.zoom}
              )

              L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
                  attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
                  maxZoom: 18,
                  id: 'mapbox.light',
                  accessToken: 'pk.eyJ1IjoiZGFuaWVsc2ltIiwiYSI6ImNqMHg5amg3bjAwN2wzM256aXlsNzdtd2oifQ.g9qvSNaMZUG5CKUitGSvKA'
              }).addTo($scope.$mapObject);
              // L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {foo: 'bar'}).addTo($scope.$mapObject);

              setUpWatchers(props, $scope, $scope.$mapObject)
              setUpEvents(events, $scope, $scope.$mapObject)

              // For use next time
              $scope.$emit('cd-gmap-map-ready', {
                mapObject: $scope.$mapObject
              })
              // For compatibility with angular-google-maps
              $scope.control.getGMap = () => $scope.$mapObject

              resolve($scope.$mapObject)
            })

            return mapPromise
          }
        }
      })
    }
  }

}])
