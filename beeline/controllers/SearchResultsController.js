import _ from 'lodash';
import assert from 'assert';
import querystring from 'querystring';

export default function($scope, $state, $stateParams, $http, UserService, LiteRoutesService, p, $rootScope) {

  $scope.runningRoutes = null;
  $scope.crowdstartRoutes = null;
  $scope.liteRoutes = null;

  $scope.$watchCollection(() => [
    $stateParams.originLat,
    $stateParams.originLng,
    $stateParams.destinationLat,
    $stateParams.destinationLng,
  ], ([slat, slng, elat, elng]) => {
    assert(slat && slng && elat && elng);

    const runningPromise = UserService.beeline({
      url: '/routes/search_by_latlon?' + querystring.stringify(_.assign({
        startLat: slat,
        startLng: slng,
        endLat: elat,
        endLng: elng,
        maxDistance: 500,
        tags: JSON.stringify(['public'])
      }, p.transportCompanyId ? {transportCompanyId: p.transportCompanyId}: {}))
    })
    .then((result) => {
      $scope.runningRoutes = result.data;
    })

    const lelongPromise = UserService.beeline({
      url: '/routes/search_by_latlon?' + querystring.stringify(_.assign({
        startLat: slat,
        startLng: slng,
        endLat: elat,
        endLng: elng,
        maxDistance: 500,
        tags: JSON.stringify(['lelong']),
      }, p.transportCompanyId ? {transportCompanyId: p.transportCompanyId}: {}))
    })
    .then((result) => {
      $scope.crowdstartRoutes = result.data;
    })

    const litePromise = UserService.beeline({
      url: '/routes/search_by_latlon?' + querystring.stringify(_.assign({
        startLat: slat,
        startLng: slng,
        endLat: elat,
        endLng: elng,
        maxDistance: 500,
        tags: JSON.stringify(['lite']),
      }, p.transportCompanyId ? {transportCompanyId: p.transportCompanyId}: {}))
    })
    .then((result) => {
      $scope.liteRoutes = LiteRoutesService.transformLiteRouteData(result.data);
    })

  })

  $scope.$watchGroup(['liteRoutes', 'crowdstartRoutes', 'runningRoutes'], (routes) => {
    $scope.routesFoundCount = _.sumBy(routes, r => r ? r.length : 0)
  })

  $scope.submitSuggestion = () => {
    var href = "https://www.beeline.sg/suggest.html#" + querystring.stringify({
      originLat: $stateParams.originLat,
      originLng: $stateParams.originLng,
      destinationLat: $stateParams.destinationLat,
      destinationLng: $stateParams.destinationLng,
      referrer: $rootScope.o.APP.NAME.replace(/\s/g, '')
    });

    if (typeof cordova !== 'undefined') {
      cordova.InAppBrowser.open(href, '_system');
    }
    else {
      window.open(href, '_blank');
    }
  };

};
