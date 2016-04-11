import {formatHHMM_ampm} from '../shared/format';
import _ from 'lodash';

export default function($scope, $state, $stateParams, $ionicModal, $cordovaGeolocation,
                        uiGmapGoogleMapApi, BookingService, RoutesService) {

  $scope.data = {}

  RoutesService.addReqData('unused pickup text',
                           'unused dropoff text',
                           $stateParams.pickupLat,
                           $stateParams.pickupLng,
                           $stateParams.dropoffLat,
                           $stateParams.dropoffLng);
  RoutesService.getclosestroute().then(function(result) {
    //store a copy of the search results in the Search object
    console.log('got results');
    console.log(result);
    RoutesService.setresults(result.data);
    //sift through the data to get the values we need
    $scope.data.searchresults = [];
    for (var i = 0; i < result.data.length; i++) {
      var e = result.data[i];
      var sstop = e.nearestBoardStop;
      var estop = e.nearestAlightStop;
      var sd = new Date(sstop.time);
      var ed = new Date(estop.time);
      var temp = {
        id: e.id,
        busnum: 'ID ' + e.id,
        stime: formatHHMM_ampm(sd),
        etime: formatHHMM_ampm(ed),
        sstop: sstop.stop.description,
        estop: estop.stop.description,
        sident: 'ID ' + sstop.stop.postcode,
        eident: 'ID ' + estop.stop.postcode,
        sroad: sstop.stop.road,
        eroad: estop.stop.road,
        swalk: e.distanceToStart.toFixed(0) + 'm',
        ewalk: e.distanceToEnd.toFixed(0) + 'm',
        active: 'Mon-Fri only'
      };
      $scope.data.searchresults.push(temp);
    }
  });

  $scope.showRouteDetails = function(item) {
    //redirect to Routes Details
    BookingService.routeId = item.id;
    $state.go('tabs.bookingPickup');
  };

}

// http://192.168.99.100:8100/#/tabs/results?pickupLat=1.430368&pickupLng=103.83536279999998&dropoffLat=1.2659729&dropoffLng=103.8205054
// lat: 1.430368, lng: 103.83536279999998
// lat: 1.2659729, lng: 103.8205054