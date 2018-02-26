import yourRoutesListTemplate from "./yourRoutesList.html"

angular.module("beeline").directive("yourRoutesList", [
  function() {
    return {
      restrict: "E",
      template: yourRoutesListTemplate,
    }
  },
])
