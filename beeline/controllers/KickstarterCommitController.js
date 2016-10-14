import {NetworkError} from '../shared/errors';
import {formatDate, formatTime, formatUTCDate, formatHHMM_ampm} from '../shared/format';
import loadingTemplate from '../templates/loading.html';
import assert from 'assert';

var increaseBidNo = function(route, price) {
  for (let tier of route.notes.tier) {
    if (tier.price <= price) {
      tier.no++;
    }
  }
}

export default [
  '$rootScope','$scope','$state','$stateParams','$http','RoutesService','loadingSpinner',
  'UserService','KickstarterService',
  function(
    $rootScope,$scope,$state,$stateParams,$http,RoutesService,loadingSpinner,UserService,
    KickstarterService
  ) {
    // Default settings for various info used in the page
    $scope.book = {
      routeId: null,
      boardStopId: null,
      alightStopId: null,
      route: null,
      notExpired: true,
      bidPrice: null,
    };


    $scope.book.routeId = +$stateParams.routeId;

    var routePromise;
    routePromise = KickstarterService.getBidInfo($scope.book.routeId);

    routePromise.then((route) => {

      $scope.book.route = route[0];
      console.log("COMMIT");
      console.log($scope.book.route);
      if ($scope.book.route.notes && $scope.book.route.notes.lelongExpiry) {
       var now = new Date().getTime();
       var expiryTime = new Date($scope.book.route.notes.lelongExpiry).getTime();
       if (now > expiryTime) {
         $scope.book.notExpired = false;
       }
      }
      $scope.book.bidPrice = $scope.book.route.bid.userOptions.price;
      console.log("BID PRICE");
      console.log($scope.book.bidPrice);
    });
  }
];
//
