export default function() {
  return {
    replace: false,
    template: `
    <cd-gmap-polyline path="routePath" style="style" static="true"></cd-gmap-polyline>
    `,
    scope: {
      'routePath': '<',
    },
    controller: function($scope) {
      $scope.style = {
        color: '#4b3863',
        weight: 3.0,
        opacity: 0.7
      };
    },
  };
}
