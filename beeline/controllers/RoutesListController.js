import _ from 'lodash';
import shareReferralModalTemplate from '../templates/share-referral-modal.html';

// Parse out the available regions from the routes
// Filter what is displayed by the region filter
// Split the routes into those the user has recently booked and the rest
export default function($scope, $state, UserService, RoutesService, $q,
  BookingService, $ionicScrollDelegate, LiteRoutesService, $ionicPopup,
  LiteRouteSubscriptionService, $timeout, SearchService, $ionicModal, $cordovaSocialSharing) {

  // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  $scope.data = {
    regions: [],
    routes: [],
    recentRoutes: [],
    selectedRegionId: undefined,
    filterText: '',
    stagingFilterText: '',
    filteredActiveRoutes: [],
    filteredRecentRoutes: [],
    nextSessionId: null,
    liteRoutes: [],
    filteredLiteRoutes: [],
  };

  // Modal for sharing referral
  $scope.hasCordova = !!window.cordova || false
  $scope.shareReferralModal = $ionicModal.fromTemplate(
    shareReferralModalTemplate,
    {scope: $scope}
  );
  $scope.cordovaShare = async function(){
    $cordovaSocialSharing.share($scope.shareMsg, "Try out Beeline!")
  }

  $scope.$on('$ionicView.beforeEnter', () => {
    $scope.data.nextSessionId = BookingService.newSession();
  })

  $scope.$watch(() => RoutesService.getActivatedKickstarterRoutes(), (rpRoutes) => {
    $scope.data.activatedKickstarterRoutes = rpRoutes;
  });

  $scope.$watch(function() {
    return UserService.getUser();
  }, function(newUser) {
    $scope.user = newUser;

    if(newUser){
      $scope.shareMsg = UserService.getReferralMsg()
    } else {
      $scope.shareMsg = null
    }
    
    if(!JSON.parse(window.localStorage.showedReferralModal) && newUser){
      window.localStorage.showedReferralModal = true
      $scope.shareReferralModal.show()
    }  
  });

  RoutesService.fetchRoutesWithRoutePass();

  // $scope.$watch('data.liteRoutes', updateSubscriptionStatus)
  // $scope.$watch(() => Svc.getSubscriptionSummary(), updateSubscriptionStatus)
  var allLiteRoutesPromise

  $scope.refreshRoutes = function (ignoreCache) {
    RoutesService.fetchRouteCredits(ignoreCache);
    RoutesService.fetchRoutes(ignoreCache);
    var routesPromise = RoutesService.fetchRoutesWithRoutePass();
    var recentRoutesPromise = RoutesService.fetchRecentRoutes(ignoreCache);

    // Lite Routes
    allLiteRoutesPromise = LiteRoutesService.getLiteRoutes(ignoreCache);
    var liteRouteSubscriptionsPromise = LiteRouteSubscriptionService.getSubscriptions(ignoreCache);
    // allLiteRoutesPromise.then(function(allLiteRoutes){
    //   $scope.data.liteRoutes = allLiteRoutes;
    // })
    $q.all([allLiteRoutesPromise, liteRouteSubscriptionsPromise]).then((response)=>{
      var allLiteRoutes, liteRouteSubscriptions;
      [allLiteRoutes, liteRouteSubscriptions] = response;
      $scope.data.liteRoutes = _.sortBy(allLiteRoutes, 'label');
    })

    $q.all([routesPromise, recentRoutesPromise, allLiteRoutesPromise, liteRouteSubscriptionsPromise]).then(() => {
      $scope.error = null;
    })
    .catch(() => {
      $scope.error = true;
    })
    .then(() => {
      $scope.$broadcast('scroll.refreshComplete');
    })

  };

  $scope.$watch(() => RoutesService.getRoutesWithRoutePass(), (allRoutes) => {

    $scope.data.routes = _.sortBy(allRoutes, 'label', (route) => {
      var firstTripStop = _.get(route, 'trips[0].tripStops[0]');
      var midnightOfTrip = new Date(firstTripStop.time.getTime());

      midnightOfTrip.setHours(0,0,0,0);
      return firstTripStop.time.getTime() - midnightOfTrip.getTime();
    });
  })

  $scope.$watchCollection(() => [
    RoutesService.getRecentRoutes(),
    RoutesService.getRoutesWithRoutePass(),
  ], ([recentRoutes, allRoutes]) => {
    if(recentRoutes && allRoutes){
      let allRoutesById = _.keyBy(allRoutes, 'id')

      $scope.data.recentRoutes = recentRoutes
        .map(r => _.assign({
                            alightStopStopId: r.alightStopStopId,
                            boardStopStopId: r.boardStopStopId
                          },allRoutesById[r.id]))
        .filter(r => r.id !== undefined)
    }
  })

  // Filter the displayed routes by selected region
  $scope.$watchGroup(['data.routes',  'data.liteRoutes', 'data.activatedKickstarterRoutes', 'data.selectedRegionId', 'data.filterText'], function([routes, liteRoutes, activatedKickstarterRoutes, selectedRegionId, filterText]) {
    var normalAndLiteRoutes = routes.concat(_.values(liteRoutes));
    $scope.data.regions = RoutesService.getUniqueRegionsFromRoutes(normalAndLiteRoutes);
    $scope.data.filteredActiveRoutes = SearchService.filterRoutes(routes, +selectedRegionId, filterText);
    $scope.data.filteredLiteRoutes = SearchService.filterRoutes(liteRoutes, +selectedRegionId, filterText);
    $scope.data.filteredActivatedKickstarterRoutes = SearchService.filterRoutes(activatedKickstarterRoutes, +selectedRegionId, filterText);
  });

  // Throttle the actual updating of filter text
  $scope.updateFilter = _.throttle((value) => {
    // Some times this function is called synchronously, some times it isn't
    // Use timeout to ensure that we are always inside a digest cycle.
    setTimeout(() => {
      $scope.data.filterText = $scope.data.stagingFilterText;
      $scope.$digest();
    }, 0)
  }, 400, {trailing: true})

  // Filter the recent routes display whenever the active routes is changed
  // This cascades the region filter from the previous block
  $scope.$watchGroup(['data.filteredActiveRoutes', 'data.recentRoutes', 'data.filteredActivatedKickstarterRoutes'], function([newActiveRoutes, recentRoutes, newKickstarterRoutes]) {
    if(!recentRoutes) return

    $scope.data.recentRoutesById = _.keyBy(recentRoutes, r => r.id);
    $scope.data.filteredRecentRoutes = recentRoutes.map(
      recent => newActiveRoutes.find(route => route.id === recent.id)
    ).filter(x => x) // Exclude null values (e.g. expired routes)

    // filter out duplicate ones in recently booked to prevent displaying it too many times
    $scope.data.filteredRecentRoutes = _.difference($scope.data.filteredRecentRoutes, newKickstarterRoutes);
  });

  $scope.$watchGroup(['data.filteredRecentRoutes', 'data.filteredActiveRoutes', 'data.filteredLiteRoutes', 'data.filteredActivatedKickstarterRoutes'],
    () => {
      $ionicScrollDelegate.resize();
  });

  $scope.$watchCollection(() =>
    [].concat(LiteRouteSubscriptionService.getSubscriptionSummary())
    .concat([$scope.data.liteRoutes]),
    () => {
      var subscribedRoutes = LiteRouteSubscriptionService.getSubscriptionSummary();
      _.forEach($scope.data.liteRoutes,(liteRoute)=>{
        if (subscribedRoutes.includes(liteRoute.label)) {
          liteRoute.isSubscribed = true;
        }
        else {
          liteRoute.isSubscribed = false;
        }
      })
    }
  );

  // Don't override the caching in main.js
  $scope.refreshRoutes();

}
