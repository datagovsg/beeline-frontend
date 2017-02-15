import _ from 'lodash';
import assert from 'assert';
import querystring from 'querystring';

export default function($scope, $state, $stateParams, $http, UserService,
  LiteRoutesService, p, $rootScope, BookingService, KickstarterService) {

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

    function search(options, reversed) {
      const latLngOptions = reversed ? _.assign(
        (elat && elng) ? {startLat: elat, startLng: elng} : {},
        (slat && slng) ? {endLat: slat, endLng: slng} : {}
      ) : _.assign(
        (slat && slng) ? {startLat: slat, startLng: slng} : {},
        (elat && elng) ? {endLat: elat, endLng: elng} : {}
      );

      return UserService.beeline({
        url: '/routes/search_by_latlon?' + querystring.stringify(
          _.assign(
            {maxDistance: 2000, startTime: Date.now()},
            latLngOptions,
            p.transportCompanyId ? {transportCompanyId: p.transportCompanyId}: {},
            options
          )
        )
      })
    }

    const runningPromise = search({
      tags: JSON.stringify(['public'])
    }, false)
    .then((result) => {
      $scope.runningRoutes = result.data;
    })

    const runningReversePromise = search({
      tags: JSON.stringify(['public'])
    }, true)
    .then((result) => {
      $scope.runningReverseRoutes = result.data;
    })

    // Crowdstart routes need extra meta data
    const allLelongRoutes = KickstarterService.fetchLelong()

    const lelongPromise = search({
      tags: JSON.stringify(['lelong'])
    }, false)

    const lelongReversePromise = search({
      tags: JSON.stringify(['lelong'])
    }, true)

    Promise.all([allLelongRoutes, lelongPromise, lelongReversePromise])
    .then(([ksRoutes, fwd, bwd]) => {
      const routesByKey = _.keyBy(ksRoutes, 'id')

      $scope.crowdstartRoutes = _.map(fwd.data, r => routesByKey[r.id]);
      $scope.crowdstartReverseRoutes = _.map(bwd.data, r => routesByKey[r.id]);
    });

    const litePromise = search({
      tags: JSON.stringify(['lite'])
    }, false)
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
