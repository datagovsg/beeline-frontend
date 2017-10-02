import {
  propsToAngularProps, optionsFromProps, setUpWatchers, setUpEvents
} from './util.js'
import * as L from 'leaflet'

const props = {
  style: {},
  path: {
    jsSet (obj, v) { obj.setLatLngs(v) }
  },
}

const events = [
  'click',
  'dblclick',
  'drag',
  'dragend',
  'dragstart',
  'mousedown',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'rightclick',
]

angular.module('cdGmap')
.directive('cdGmapPolyline',
['cdGmapSettings', 'cdGmapApi',
function (cdGmapSettings, cdGmapApi) {
  return {
    restrict: 'E',
    template: '',

    require: {
      map: '^^cdGmapGoogleMap',
    },

    replace: true,

    scope: propsToAngularProps(props, events),

    link (scope, elem, attrs, ctrl) {
      if (cdGmapSettings.useNativeMaps) {
        throw new Error("Native maps not implemented")
      } else {
        ctrl.map.$mapPromise.then((gmap) => {
          const options = optionsFromProps(props, scope, [])

          scope.$polylineObject = L.polyline(options.path).addTo(gmap)

          scope.$on('$destroy', () => {
            scope.$polylineObject.remove()
          })

          setUpWatchers(props, scope, scope.$polylineObject)
          setUpEvents(events, scope, scope.$polylineObject)
        })
      }
    },
  }

}])
