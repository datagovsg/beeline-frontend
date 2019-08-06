import expiryModalTemplate from './routePassExpiryModal.html'
import _ from 'lodash'
import moment from 'moment'

angular.module('beeline').directive('routePassExpiryModal', [
  '$stateParams',
  'RoutesService',
  function ($stateParams, RoutesService) {
    return {
      restrict: 'E',
      template: expiryModalTemplate,
      scope: {
        route: '=',
        modal: '=',
      },
      link: function (scope, element, attributes) {
        scope.$watchGroup(
          [
            () => RoutesService.getRoutePassExpiries(),
            'route',
          ],
          ([routePassExpiries, route]) => {
            // Input validation
            if (!route || !route.tags || !routePassExpiries) return

            // map the expiry dates of the route passes keyed by
            // the route's tags into expiries
            let expiries = {}
            for (let tag of route.tags) {
              if (tag in routePassExpiries) {
                _.assign(expiries, routePassExpiries[tag])
              }
            }

            let expiryInfo = []

            for (let expiryDate of Object.keys(expiries)) {
              let expiresOn = moment(expiryDate)
              let expiresIn = expiresOn
                .clone()
                .add(1, 'days')
                .diff(moment(), 'days')

              expiryInfo.push({
                expiresIn,
                expiresOn,
                qty: expiries[expiryDate],
              })
            }

            scope.expiryInfo = expiryInfo
          }
        )
      },
    }
  },
])
