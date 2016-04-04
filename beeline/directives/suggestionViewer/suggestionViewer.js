import {defaultMapOptions, dashedLineIcons} from '../../shared/util'

export default function SuggestionViewer(app) {
    app.directive('suggestionViewer', [
        '$state',
        '$ionicModal',
        '$http',
        'uiGmapGoogleMapApi',
        'uiGmapIsReady',
    function (
        $state,
        $ionicModal,
        $http,
        uiGmapGoogleMapApi,
        uiGmapIsReady
        ) {

        return {
            restrict: 'E',
            template: require('./suggestionViewer.html'),
            scope: {
                startLat: '=',
                startLng: '=',
                startDescriptionA: '=',
                startDescriptionB: '=',
                endLat: '=',
                endLng: '=',
                endDescriptionA: '=',
                endDescriptionB: '=',
            },
            link: function (scope, elem, attrs) {
				scope.map = defaultMapOptions();

                scope.showStart = scope.showEnd = true;

                scope.$watchGroup(['showStart', 'showEnd'], () => {
                    scope.line = [
                        {latitude: scope.startLat, longitude: scope.startLng},
                        {latitude: scope.endLat, longitude: scope.endLng},
                    ];
                    scope.icons = dashedLineIcons();
                });

                scope.fitMarkers = function () {
                    uiGmapIsReady.promise().then(() => {
                        var llBounds = new google.maps.LatLngBounds();
                        llBounds.extend(new google.maps.LatLng({
                            lat: scope.startLat,
                            lng: scope.startLng,
                        }))
                        llBounds.extend(new google.maps.LatLng({
                            lat: scope.endLat,
                            lng: scope.endLng,
                        }))
                        scope.map.control.getGMap().fitBounds(llBounds);
                    });
                }

                uiGmapGoogleMapApi.then(function x() {
                    scope.map.boardMarkerOptions = {
                        icon: {
                            url: 'img/board.png',
                            scaledSize: new google.maps.Size(20,20),
                            anchor: new google.maps.Point(5,5),
                        },
                    };
                    scope.map.alightMarkerOptions = {
                        icon: {
                            url: 'img/alight.png',
                            scaledSize: new google.maps.Size(20,20),
                            anchor: new google.maps.Point(5,5),
                        },
                    };
                    scope.fitMarkers();
                });

                // FIXME
                scope.$on('mapRequireResize', async function() {
                    await uiGmapGoogleMapApi;
                    google.maps.event.trigger($scope.map.mapControl.getGMap(), 'resize');
                })

            },
        };
    }]);
};
