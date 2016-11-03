
import {NetworkError} from '../shared/errors';
import {formatDate, formatTime, formatUTCDate, formatHHMM_ampm} from '../shared/format';
import loadingTemplate from '../templates/loading.html';
import assert from 'assert';

export default [
  '$rootScope','$scope','$interpolate','$state','$stateParams','$ionicModal','$http',
  'BookingService','RoutesService','loadingSpinner','UserService','$ionicLoading',
  '$ionicPopup','KickstarterService','CompanyService', 'StripeService',
  function(
    $rootScope,$scope,$interpolate,$state,$stateParams,$ionicModal,$http,
    BookingService,RoutesService,loadingSpinner,UserService,$ionicLoading,
    $ionicPopup,KickstarterService,CompanyService,StripeService
  ) {
    // Default settings for various info used in the page
    $scope.book = {
      routeId: null,
      boardStopId: null,
      alightStopId: null,
      route: null,
      notExpired: true,
      isBid: null,
    };

    $scope.book.routeId = +$stateParams.routeId;
    $scope.book.boardStopId = +$stateParams.boardStop;
    $scope.book.alightStopId = +$stateParams.alightStop;

    $scope.$watch(()=>KickstarterService.getLelongById($scope.book.routeId), (route)=>{
      if (!route) return;
      $scope.book.route = route;
    })

    $scope.updateSelection = function(position, tiers, price) {
      _.forEach(tiers, function(tier, index){
        if (position == index) {
          $scope.book.bidPrice = $scope.book.bidPrice == price ? null : price;
        } else {
          tier.checked = false;
        }
      })
    }
  }
];
//
