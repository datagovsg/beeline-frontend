import {
  propsToAngularProps, optionsFromProps, setUpWatchers, setUpEvents
} from './util.js'
import * as L from 'leaflet'

const props = {
  latLng: {},
}

const events = [
  'domready',
  'closeclick',
]

angular.module('cdGmap')
.directive('cdGmapInfoWindow',
['cdGmapSettings', 'cdGmapApi',
function (cdGmapSettings, cdGmapApi) {
  return {
    restrict: 'E',
    transclude: true,
    template: '<div><div class="flyaway"><ng-transclude></ng-transclude></div></div>',

    require: {
      map: '^^cdGmapGoogleMap',
    },

    replace: true,

    scope: {
      ...propsToAngularProps(props, events),
      show: '=',
    },

    link (scope, elem, attrs, ctrl) {
      if (cdGmapSettings.useNativeMaps) {
        throw new Error("Native maps not implemented")
      } else {
        ctrl.map.$mapPromise.then((gmap) => {
          const options = optionsFromProps(props, scope, [])
          scope.$infoWindowObject = L.popup()
            .setContent(elem[0].querySelector('.flyaway'))
            .setLatLng(options.latLng)

          // Bind `show` attribute
          scope.$infoWindowObject.on('remove', () => {
            scope.show = false
          })

          scope.$on('$destroy', () => {
            scope.$infoWindowObject.remove()
          })

          scope.$watch('show', (s) => {
            if (s) {
              scope.$infoWindowObject.openOn(gmap)
            } else {
              scope.$infoWindowObject.remove()
            }
          })

          setUpWatchers(props, scope, scope.$infoWindowObject)
          setUpEvents(events, scope, scope.$infoWindowObject)
        })
      }
    },
  }

}])
