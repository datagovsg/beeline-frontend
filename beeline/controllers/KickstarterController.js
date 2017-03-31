import _ from 'lodash';
import kickstartHelpTemplate from '../templates/kickstart-popup.html';
import loadingTemplate from '../templates/loading.html';


// Parse out the available regions from the routes
// Filter what is displayed by the region filter
// Split the routes into those the user has recently booked and the rest
export default function($scope, $state, UserService, RoutesService, $q,
  $ionicScrollDelegate, $ionicPopup, KickstarterService, $ionicLoading,
  SearchService, $timeout, loadingSpinner) {

  // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  $scope.data = {
    error: null,
    kickstarter: null,
    backedKickstarter: null,
    regions: [],
    filterText: '',
    stagingFilterText: '',
    nearbyKickstarterRoutes: null
  };

  $scope.disp = {
    showNearbyKickstarter: true,
    showAvailableKickstarter: true
  }

  $scope.refreshRoutes = function() {
    $q.all([KickstarterService.fetchLelong(true),KickstarterService.fetchBids(true), KickstarterService.fetchNearbyKickstarterIds()])
    .then(()=>{
      $scope.data.error = null;
    })
    .catch(() => {
      $scope.data.error = true;
    })
    .then(() => {
      $scope.$broadcast('scroll.refreshComplete');
    })
  }

  var timeoutProise = function(promise, ms) {
    return Promise.race([promise, new Promise((resolve,reject)=>{
      $timeout(()=>reject(), ms);
    })])
  }

  //show loading spinner for the 1st time
  loadingSpinner(timeoutProise(KickstarterService.fetchLelong(), 10*6000)
                  .then(()=>{
                    $scope.data.error = null;
                  })
                  .catch(()=>{
                    $scope.data.error = true;
                  })
                  .then(()=>{
                    if (!window.localStorage['showCrowdstart']) {
                      window.localStorage['showCrowdstart'] = true;
                      $scope.showHelpPopup();
                    }
                  }));

  $scope.$watchGroup([
    ()=>KickstarterService.getLelong(),
    ()=>KickstarterService.getNearbyKickstarterIds(),
    ()=>KickstarterService.getBids(),
    'data.selectedRegionId',
    'data.filterText',
  ], ([lelongRoutes, nearByLelongIds, userBids, selectedRegionId, filterText])=>{
      if (!lelongRoutes) return;
      //sort by numeric part of label (to fix c100 appears before c99)
      $scope.data.kickstarter = _.sortBy(lelongRoutes, (x)=>{
        return parseInt(x.label.slice(1))
      })
      $scope.userBids = userBids;
      $scope.recentBidsById = _.keyBy($scope.userBids, r=>r.routeId);
      var recentAndAvailable = _.partition($scope.data.kickstarter, (x)=>{
        return _.includes(_.keys($scope.recentBidsById), x.id.toString());
      });
      // don't display it in backed list if the pass expires after 1 month of 1st trip
      //and don't display it if it's 7 days after expired and not actived
      $scope.data.backedKickstarter = recentAndAvailable[0].filter((route)=>(!route.passExpired && route.isActived) || !route.isExpired || !route.is7DaysOld);
      //don't display it in kickstarter if it's expired
      $scope.data.kickstarter = recentAndAvailable[1].filter((route)=>!route.isExpired);
      //regions from list of backed and not expired available
      $scope.data.regions = RoutesService.getUniqueRegionsFromRoutes($scope.data.backedKickstarter.concat($scope.data.kickstarter));
      //nearby Lelong routes and the rest
      if (nearByLelongIds) {
        [$scope.data.nearbyKickstarterRoutes, $scope.data.kickstarter] = _.partition($scope.data.kickstarter, (r)=>nearByLelongIds.indexOf(r.id)!=-1);
        $scope.data.filteredNearbyKickstarter = SearchService.filterRoutes($scope.data.nearbyKickstarterRoutes, +selectedRegionId, filterText);
      }
      $scope.data.filteredKickstarter = SearchService.filterRoutes($scope.data.kickstarter, +selectedRegionId, filterText);
      $scope.data.filteredbackedKickstarter = SearchService.filterRoutes($scope.data.backedKickstarter, +selectedRegionId, filterText);
  });


  // Throttle the actual updating of filter text
  $scope.updateFilter = _.throttle((value) => {
    // Some times this function is called synchronously, some times it isn't
    // Use timeout to ensure that we are always inside a digest cycle.
    setTimeout(() => {
      $scope.data.filterText = $scope.data.stagingFilterText;
      $scope.$digest();
    }, 0)
  }, 400, {trailing: true});


  $scope.showHelpPopup = function(){
    $scope.kickstartHelpPopup = $ionicPopup.show({
      template: kickstartHelpTemplate,
      title: 'Crowdstart Routes',
      buttons: [
        {
          text: 'OK',
          type: 'button-positive',
          onTap: function(e) {
            $scope.closePopup();
          }
        }
      ]
    });
  }

  $scope.closePopup = function() {
    $scope.kickstartHelpPopup.close();
  }

}
