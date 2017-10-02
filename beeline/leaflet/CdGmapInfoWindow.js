import {
  propsToAngularProps, optionsFromProps, setUpWatchers, setUpEvents
} from './util.js'

const props = {
  options: {},
  position: {},
  zIndex: {},
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
          scope.$infoWindowObject = new google.maps.InfoWindow({
            map: gmap,
            content: elem[0].querySelector('.flyaway'),
            ...optionsFromProps(props, scope, []),
          })

          // Bind `show` attribute
          google.maps.event.addListener(scope.$infoWindowObject, 'closeclick', () => {
            scope.show = false
          })

          scope.$on('$destroy', () => {
            scope.$infoWindowObject.setMap(null)
          })

          scope.$watch('show', (s) => {
            if (s) {
              scope.$infoWindowObject.open(gmap)
            } else {
              scope.$infoWindowObject.close()
            }
          })

          setUpWatchers(props, scope, scope.$infoWindowObject)
          setUpEvents(events, scope, scope.$infoWindowObject)
        })
      }
    },
  }

}])
