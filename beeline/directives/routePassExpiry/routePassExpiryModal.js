import expiryModalTemplate from "./routePassExpiryModal.html"
import _ from "lodash"
import moment from "moment"

angular.module("beeline").directive("routePassExpiryModal", [
  "$stateParams",
  "RoutesService",
  function($stateParams, RoutesService) {
    return {
      restrict: "E",
      template: expiryModalTemplate,
      scope: {
        routeId: "@",
        modal: "=",
      },
      link: function(scope, element, attributes) {
        scope.$watchGroup(
          [
            () => RoutesService.getRoutePassTags(),
            () => RoutesService.getRoutePassExpiries(),
          ],
          ([routePassTags, routePassExpiries]) => {
            // Input validation
            if (!routePassTags || !routePassExpiries) return

            let tags = routePassTags[scope.routeId]
            let expiries = {}
            for (let tag of tags) {
              _.assign(expiries, routePassExpiries[tag])
            }

            let expiryInfo = []

            for (let expiryDate of Object.keys(expiries)) {
              let expiresOn = moment(expiryDate)
              let expiresIn = expiresOn
                .clone()
                .add(1, "days")
                .diff(moment(), "days")

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
