import {formatHHMM_ampm} from '../shared/format';
import _ from 'lodash';

export default function($scope, $stateParams, RoutesService) {
  $scope.data = {}
  RoutesService.addReqData('unused pickup text',
                           'unused dropoff text',
                           $stateParams.pickupLat,
                           $stateParams.pickupLng,
                           $stateParams.dropoffLat,
                           $stateParams.dropoffLng);
  RoutesService.getclosestroute().then(function(result) {
    RoutesService.setresults(result.data);
    $scope.data.activeRoutes = result.data
    console.log(result.data);
  });

}

// http://192.168.99.100:8100/#/tabs/results?pickupLat=1.430368&pickupLng=103.83536279999998&dropoffLat=1.2659729&dropoffLng=103.8205054
// lat: 1.430368, lng: 103.83536279999998
// lat: 1.2659729, lng: 103.8205054