import searchRoutesListTemplate from "./searchRoutesList.html"

angular.module("beeline").directive("searchRoutesList", [
  function() {
    return {
      restrict: "E",
      replace: "true",
      template: searchRoutesListTemplate,
    }
  },
])
