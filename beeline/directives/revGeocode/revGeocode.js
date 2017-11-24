// <rev-geocode x="longitude" y="latitude"></rev-geocode>

// {{block_number}} {{road}}<br/>
// {{postcode}}
import qs from 'querystring'
import {titleCase} from '../../shared/format'

export default [
    '$http',
    'OneMapService',
    'UserService',
    function ($http,
             OneMapService,
             UserService) {
      return {
        restrict: 'E',
        transclude: true,
        scope: {
          x: '=',
          y: '=',
          geocodeW: '=',
          geocodePromiseW: '=',
          description1: '=',
          description2: '=',
        },
        template: `
<div ng-if="geocodeW && geocodeW.GeocodeInfo[0].ROAD != null">
    {{geocodeW.GeocodeInfo[0].BLOCK | titleCase}}
    {{geocodeW.GeocodeInfo[0].ROAD | titleCase}}
    {{geocodeW.GeocodeInfo[0].BUILDINGNAME | titleCase}}
    {{geocodeW.GeocodeInfo[0].POSTALCODE | titleCase}}
</div>
<div ng-if="!(geocodeW && geocodeW.GeocodeInfo[0].ROAD != null)">
    {{y | number:4}}, {{x | number:4}}
</div>
        `,
        link: async function (scope, elem) {
            scope.geocodeW = {}// `${scope.y}, ${scope.x}`
            let oneMapToken = await OneMapService.token()
            // var url = `http://staging.beeline.sg/onemap/revgeocode?location=${scope.x},${scope.y}`;

            function updateDescription () {
                if (scope.geocodeW && scope.geocodeW.GeocodeInfo &&
                    scope.geocodeW.GeocodeInfo[0].ROAD) {
                    scope.description1 = titleCase(scope.geocodeW.GeocodeInfo[0].BLOCK)
                        + ' ' + titleCase(scope.geocodeW.GeocodeInfo[0].ROAD)
                    scope.description2 = titleCase(scope.geocodeW.GeocodeInfo[0].BUILDINGNAME)
                } else {
                    scope.description1 =
                        parseFloat(scope.y).toFixed(4) + ', ' +
                        parseFloat(scope.x).toFixed(4)
                    scope.description2 = null
                }
            }
            function geocode () {
                scope.geocodePromiseW = UserService.beeline({
                    method: 'GET',
                    url: `/onemap/revgeocode?location=${scope.x},${scope.y}`,
                })
                .then((response) => {
                    // console.log(response);
                    scope.geocodeW = response.data
                    updateDescription()
                })
            }
            scope.$watchGroup(['x', 'y'], geocode)
            // Hack to reverse the erasure of the description when suggestion page is reloaded
            scope.$watchGroup(['description1', 'description2'], function () {
                if (scope.description1 == undefined || scope.description2 == undefined) {
                    updateDescription()
                }
            })
        }, /* link(...) */
      }
    },
  ]
