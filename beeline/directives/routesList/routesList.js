import routesListTemplate from "./routesList.html"

angular.module("beeline").directive("routesList", [
  function() {
    return {
      restrict: "E",
      replace: "true",
      template: routesListTemplate,
    }
  },
])
