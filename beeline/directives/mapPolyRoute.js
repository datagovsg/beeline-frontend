angular.module("beeline").directive("mapPolyRoute", function() {
  return {
    replace: false,
    template: `
    <ui-gmap-polyline path="routePath" stroke="strokeOptions" static="true"></ui-gmap-polyline>
    `,
    scope: {
      routePath: "<",
    },
    link: function(scope, element, attributes) {
      scope.strokeOptions = {
        color: "#4b3863",
        weight: 3.0,
        opacity: 0.7,
      }
    },
  }
})
