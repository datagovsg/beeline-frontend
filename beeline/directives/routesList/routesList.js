import routesListTemplate from './routesList.html'
import querystring from 'querystring'

angular.module('beeline').directive('routesList', [
  '$rootScope',
  function ($rootScope) {
    return {
      restrict: 'E',
      replace: 'true',
      template: routesListTemplate,
      link (scope, elem, attr) {
        scope.openLink = function (event) {
          event.preventDefault()
          let appName = $rootScope.o.APP.NAME.replace(/\s/g, '')
          window.open(
            'https://www.beeline.sg/suggest.html#' +
              querystring.stringify({ referrer: appName }),
            '_system'
          )
        }
      },
    }
  },
])
