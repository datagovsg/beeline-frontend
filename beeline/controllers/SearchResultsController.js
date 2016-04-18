import {formatHHMM_ampm} from '../shared/format';
import _ from 'lodash';

export default function($scope, $stateParams, RoutesService) {

  $scope.data = {}
  $scope.searchResults = [];

  function updateSearch() {
    $scope.search = {
      pickup:  [parseFloat($stateParams.pickupLng),  parseFloat($stateParams.pickupLat)],
      dropoff: [parseFloat($stateParams.dropoffLng), parseFloat($stateParams.dropoffLat)],
    }
  }
  updateSearch();

  $scope.$on('$ionicView.beforeEnter', function() {
    updateSearch();

    RoutesService.searchRoutes({
      startLat: $stateParams.pickupLat,
      startLng: $stateParams.pickupLng,
      endLat: $stateParams.dropoffLat,
      endLng: $stateParams.dropoffLng,
      arrivalTime: '2016-02-26 01:00:00+00',
      startTime: new Date().getTime(),
      endTime: new Date().getTime() + 30*24*60*60*1000, // search 30 days into the future
    })
    .then(function(routes) {
      $scope.searchResults = routes
      console.log(routes);
    });
  });
}

// http://192.168.99.100:8100/#/tabs/results?pickupLat=1.430368&pickupLng=103.83536279999998&dropoffLat=1.2659729&dropoffLng=103.8205054
// lat: 1.430368, lng: 103.83536279999998
// lat: 1.2659729, lng: 103.8205054
