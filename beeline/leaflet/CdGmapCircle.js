import {
  propsToAngularProps, optionsFromProps, setUpWatchers, setUpEvents
} from './util.js'
import * as L from 'leaflet'

const props = {
  center: {
    jsSet (obj, v) {
      obj.setLatLng(v)
    }
  },
  radius: {
    jsSet (obj, v) {
      obj.setRadius(v)
    }
  },
  style: {},
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
  'rightclick'
]

angular.module('cdGmap')
.directive('cdGmapCircle',
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
          const options = optionsFromProps(props, scope)

          scope.$circleObject = new L.circle(options.center, {radius: options.radius}).addTo(gmap)

          scope.$on('$destroy', () => {
            scope.$circleObject.remove()
          })

          setUpWatchers(props, scope, scope.$circleObject)
          setUpEvents(events, scope, scope.$circleObject)
        })
      }
    },
  }

}])
