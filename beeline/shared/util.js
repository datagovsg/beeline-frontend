import _ from 'lodash'

/* Update a scope so that the child scopes also
receive the $ionicView.*Enter events */
export function setupBroadcastViewEnter($scope) {
    $scope.$on('$ionicView.afterEnter', function (a, b) {
        // var next = $scope.$$childHead;
        // while (next) {
        //     next.$broadcast('$ionicView.afterEnter', a, b);
        //     next = next.$$nextSibling;
        // }
        $scope.$broadcast('mapRequireResize')
    });
}

var lineSymbol = {
    path: 'M 0,-1 0,1',
    strokeOpacity: 1,
    scale: 4
  }
var lineIcons = {
    path: [{lat: 22.291, lng: 153.027}, {lat: 18.291, lng: 153.027}],
    strokeOpacity: 0,
    icons: [{
      icon: lineSymbol,
      offset: '0',
      repeat: '20px'
    }],
  }
export function dashedLineIcons() {
    return lineIcons;
}

export function defaultMapOptions(options) {
    return _.assign({
        center: { latitude: 1.370244, longitude: 103.823315 },
        zoom: 11,
        bounds: { //so that autocomplete will mainly search within Singapore
            northeast: {
                latitude: 1.485152,
                longitude: 104.091837
            },
            southwest: {
                latitude: 1.205764,
                longitude: 103.589899
            }
        },
        control: {},
        options: {
            disableDefaultUI: true,
            styles: [{
                featureType: "poi",
                stylers: [{
                    visibility: "off"
                }]
            }],
            draggable: true
        },
        markers: [],
        lines: [],
    }, options || {});
}
