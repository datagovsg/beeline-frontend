import _ from 'lodash';
import assert from 'assert';
import querystring from 'querystring';

export default function($scope, $state, $stateParams, $http, UserService) {

  $scope.runningRoutes = null;
  $scope.crowdstartRoutes = null;

  $scope.$watchCollection(() => [
    $stateParams.originLat,
    $stateParams.originLng,
    $stateParams.destinationLat,
    $stateParams.destinationLng,
  ], ([slat, slng, elat, elng]) => {
    assert(slat && slng && elat && elng);

    UserService.beeline({
      url: '/routes/search_by_latlon?' + querystring.stringify({
        startLat: slat,
        startLng: slng,
        endLat: elat,
        endLng: elng,
        maxDistance: 500,
        tags: JSON.stringify(['public']),
      })
    })
    .then((result) => {
      $scope.runningRoutes = result.data;
    })

    UserService.beeline({
      url: '/routes/search_by_latlon?' + querystring.stringify({
        startLat: slat,
        startLng: slng,
        endLat: elat,
        endLng: elng,
        maxDistance: 500,
        tags: JSON.stringify(['lelong']),
      })
    })
    .then((result) => {
      $scope.crowdstartRoutes = result.data;
    })
  })

};
