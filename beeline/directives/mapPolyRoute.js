export default function() {
  return {
    replace: false,
    template: `
    <cd-gmap-polyline path="routePath" options="options" static="true"></cd-gmap-polyline>
    `,
    scope: {
      'routePath': '<',
    },
    controller: function($scope) {
      $scope.options = {
        strokeColor: '#4b3863',
        strokeWeight: 3.0,
        strokeOpacity: 0.7
      };
    },
  };
}
