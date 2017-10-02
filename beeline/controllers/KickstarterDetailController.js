import {NetworkError} from '../shared/errors';
import {formatDate, formatTime, formatUTCDate, formatHHMM_ampm} from '../shared/format';
import loadingTemplate from '../templates/loading.html';
import processingPaymentsTemplate from '../templates/processing-payments.html';
import assert from 'assert';
import busStopListTemplate from '../templates/bus-stop-list.html';

export default [
  '$rootScope','$scope','$interpolate','$state','$stateParams','$ionicModal',
  '$http','$cordovaGeolocation','BookingService','RoutesService',
  'MapOptions','loadingSpinner','UserService','StripeService','$ionicLoading','$ionicPopup',
  'KickstarterService',
  function(
    $rootScope,$scope,$interpolate,$state,$stateParams,$ionicModal,$http,
    $cordovaGeolocation,BookingService,RoutesService,
    MapOptions,loadingSpinner,UserService,StripeService,$ionicLoading,$ionicPopup,
    KickstarterService
  ) {


    $scope.routePath = [];

    // Default settings for various info used in the page
    $scope.book = {
      routeId: null,
      route: null,
      bid: null,
      calculatedAmount: '',
      bidPrice: null,
    };

    $scope.book.routeId = +$stateParams.routeId;

    $scope.$watch(()=>KickstarterService.getCrowdstartById($scope.book.routeId), (route)=>{
      if (!route) return;
      $scope.book.route = route;
      $scope.book.bidOptions = route.notes.tier;
      [$scope.book.boardStops, $scope.book.alightStops] = BookingService.computeStops($scope.book.route.trips);
      $scope.busStops = $scope.book.boardStops.concat($scope.book.alightStops);
    })


    $scope.showStops = function(){
      $state.go("tabs.crowdstart-stops", {
        routeId: $scope.book.routeId
      });
    };

    $scope.updateSelection = function(position, tiers, price) {
      _.forEach(tiers, function(tier, index){
        if (position == index) {
          $scope.book.bidPrice = $scope.book.bidPrice == price ? null : price;
        }
      })
    }
  }
];
//
