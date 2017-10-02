import {
  propsToAngularProps, optionsFromProps, setUpWatchers, setUpEvents
} from './util.js'
import * as L from 'leaflet'
import * as LeafletCompat from './leaflet-compat'

const props = {
  'icon': {
    jsSet (obj, v) {
      if (v === undefined) return
      obj.setIcon(L.icon(v))
    }
  },
  'latLng': {},
  'options': {
    jsSet (obj, v) {
      if (v === undefined) return

      if (v.icon) props.icon.jsSet(obj, v.icon)
    }
  },
}

const events = [
  'click',
  'rightclick',
  'dblclick',
  'drag',
  'dragstart',
  'dragend',
  'mouseup',
  'mousedown',
  'mouseover',
  'mouseout',
]

angular.module('cdGmap')
.directive('cdGmapMarker',
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
          scope.$markerObject = new L.marker(options.latLng).addTo(gmap)

          scope.$on('$destroy', () => {
            scope.$markerObject.remove()
          })

          setUpWatchers(props, scope, scope.$markerObject)
          setUpEvents(events, scope, scope.$markerObject)
        })
      }
    },
  }

}])
