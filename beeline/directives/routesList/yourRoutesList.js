import yourRoutesListTemplate from "./yourRoutesList.html"

angular.module("beeline").directive("yourRoutesList", [
  function() {
    return {
      restrict: "E",
      replace: "true",
      template: yourRoutesListTemplate,
    }
  },
])
