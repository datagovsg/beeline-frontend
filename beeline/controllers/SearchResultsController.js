import _ from 'lodash';
import assert from 'assert';
import querystring from 'querystring';

export default function($scope, $state, $stateParams, $http, UserService, LiteRoutesService, p, $rootScope, BookingService) {

  $scope.runningRoutes = null;
  $scope.crowdstartRoutes = null;
  $scope.liteRoutes = null;

  $scope.data  = {
    nextSessionId: null
  }

  $scope.$on('$ionicView.beforeEnter', () => {
    $scope.data.nextSessionId = BookingService.newSession();
  })

  $scope.$watchCollection(() => [
    $stateParams.originLat,
    $stateParams.originLng,
    $stateParams.destinationLat,
    $stateParams.destinationLng,
  ], ([slat, slng, elat, elng]) => {
    assert((slat && slng) || (elat && elng));

    const runningPromise = UserService.beeline({
      url: '/routes/search_by_latlon?' + querystring.stringify(_.assign({
        maxDistance: 2000,
        tags: JSON.stringify(['public'])
      }, p.transportCompanyId ? {transportCompanyId: p.transportCompanyId}: {},
         (slat && slng) ? {startLat: slat, startLng: slng} : {},
         (elat && elng) ? {endLat: elat, endLng: elng} : {}))
    })
    .then((result) => {
      $scope.runningRoutes = result.data;
    })

    const runningReversePromise = UserService.beeline({
      url: '/routes/search_by_latlon?' + querystring.stringify(_.assign({
        maxDistance: 2000,
        tags: JSON.stringify(['public'])
      }, p.transportCompanyId ? {transportCompanyId: p.transportCompanyId}: {},
         (elat && elng) ? {startLat: elat, startLng: elng} : {},
         (slat && slng)? {endLat: slat, endLng: slng} : {}))
    })
    .then((result) => {
      $scope.runningReverseRoutes = result.data;
    })

    const lelongPromise = UserService.beeline({
      url: '/routes/search_by_latlon?' + querystring.stringify(_.assign({
        maxDistance: 2000,
        tags: JSON.stringify(['lelong'])
      }, p.transportCompanyId ? {transportCompanyId: p.transportCompanyId}: {},
        (slat && slng) ? {startLat: slat, startLng: slng} : {},
        (elat && elng) ? {endLat: elat, endLng: elng} : {}))
    })
    .then((result) => {
      $scope.crowdstartRoutes = result.data;
    })

    const lelongReversePromise = UserService.beeline({
      url: '/routes/search_by_latlon?' + querystring.stringify(_.assign({
        maxDistance: 2000,
        tags: JSON.stringify(['lelong'])
      }, p.transportCompanyId ? {transportCompanyId: p.transportCompanyId}: {},
        (elat && elng) ? {startLat: elat, startLng: elng} : {},
        (slat && slng)? {endLat: slat, endLng: slng} : {}))
    })
    .then((result) => {
      $scope.crowdstartReverseRoutes = result.data;
    })

    const litePromise = UserService.beeline({
      url: '/routes/search_by_latlon?' + querystring.stringify(_.assign({
        maxDistance: 2000,
        tags: JSON.stringify(['lite'])
      }, p.transportCompanyId ? {transportCompanyId: p.transportCompanyId}: {},
        (slat && slng) ? {startLat: slat, startLng: slng} : {},
        (elat && elng) ? {endLat: elat, endLng: elng} : {}))
    })
    .then((result) => {
      $scope.liteRoutes = LiteRoutesService.transformLiteRouteData(result.data);
    })

    //not needed in most cases as lite routes are looping services
    // const liteReversePromise = UserService.beeline({
    //   url: '/routes/search_by_latlon?' + querystring.stringify(_.assign({
    //     maxDistance: 2000,
    //     tags: JSON.stringify(['lite'])
    //   }, p.transportCompanyId ? {transportCompanyId: p.transportCompanyId}: {},
    //     (elat && elng) ? {startLat: elat, startLng: elng} : {},
    //     (slat && slng)? {endLat: slat, endLng: slng} : {}))
    // })
    // .then((result) => {
    //   $scope.liteReverseRoutes = LiteRoutesService.transformLiteRouteData(result.data);
    // })


  })

  $scope.$watchGroup(['liteRoutes', 'crowdstartRoutes', 'runningRoutes'], (routes) => {
    //liteRoutes is {'OCC':{}, 'JTC':{}}
    $scope.routesFoundCount = _.sumBy(routes, r => r ? (r.length || _.keys(r).length) : 0)
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
