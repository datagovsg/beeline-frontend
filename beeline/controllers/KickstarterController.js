import _ from 'lodash';
import kickstartHelpTemplate from '../templates/kickstart-popup.html';
import loadingTemplate from '../templates/loading.html';

// Return an array of regions covered by a given array of routes
function getUniqueRegionsFromRoutes(routes) {
  return _(routes).map(function(route) {return route.regions;})
  .flatten()
  .uniqBy('id')
  .sortBy('name')
  .value();
}

// Parse out the available regions from the routes
// Filter what is displayed by the region filter
// Split the routes into those the user has recently booked and the rest
export default function($scope, $state, UserService, RoutesService, $q,
  $ionicScrollDelegate, $ionicPopup, KickstarterService, $ionicLoading,
  SearchService, $timeout) {

  // https://github.com/angular/angular.js/wiki/Understanding-Scopes
  $scope.data = {
    kickstarter: null,
    backedKickstarter: null,
    regions: [],
    filterText: '',
    stagingFilterText: '',
  };

  $scope.refreshRoutes = async function() {
    try {
      await Promise.all([KickstarterService.fetchKickstarterRoutes(true), KickstarterService.fetchBids(true)]);
      $scope.error = null;
    } catch(error) {
      $scope.error = true;
    }
    $scope.$broadcast('scroll.refreshComplete');
  }

  //show loading spinner for the 1st time
  var timeout;
  $scope.$watch(()=>KickstarterService.getLelong(), (lelongRoutes)=>{
    if (!lelongRoutes) {
      $ionicLoading.show({
        template: loadingTemplate
      })
      //1 min buffer if list cannot load
      timeout = $timeout(()=>{
        if (!lelongRoutes) {
          $ionicLoading.hide();
          $scope.error = true;
        }
      }, 1000*60)
    } else {
      if (timeout) {
        $timeout.cancel(timeout);
      }
      $ionicLoading.hide();
      $scope.error = false;
      if (!window.localStorage['showKickstarter']) {
        window.localStorage['showKickstarter'] = true;
        $scope.showHelpPopup();
      }
    }
  });


  $scope.$watchGroup([
    ()=>KickstarterService.getLelong(),
    ()=>KickstarterService.getBids(),
    'data.selectedRegionId',
    'data.filterText'
  ], ([lelongRoutes, userBids, selectedRegionId, filterText])=>{
      if (!lelongRoutes) return;
      $scope.data.kickstarter = _.sortBy(lelongRoutes, 'label');
      $scope.data.regions = getUniqueRegionsFromRoutes($scope.data.kickstarter);
      $scope.userBids = userBids;
      $scope.recentBidsById = _.keyBy($scope.userBids, r=>r.routeId);
      var recentAndAvailable = _.partition($scope.data.kickstarter, (x)=>{
        return _.includes(_.keys($scope.recentBidsById), x.id.toString());
      });
      $scope.data.backedKickstarter = recentAndAvailable[0];
      //don't display it in kickstarter if it's expired
      $scope.data.kickstarter = recentAndAvailable[1].filter((route)=>!route.isExpired);
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
