import {NetworkError} from '../shared/errors';
import {formatDate, formatTime, formatUTCDate, formatHHMM_ampm} from '../shared/format';
import loadingTemplate from '../templates/loading.html';
import assert from 'assert';


export default [
  '$rootScope','$scope','$interpolate','$state','$stateParams','$ionicModal','$http',
  'BookingService','RoutesService','loadingSpinner','UserService','$ionicLoading',
  '$ionicPopup','KickstarterService','CompanyService',
  function(
    $rootScope,$scope,$interpolate,$state,$stateParams,$ionicModal,$http,
    BookingService,RoutesService,loadingSpinner,UserService,$ionicLoading,
    $ionicPopup,KickstarterService,CompanyService
  ) {
    // Default settings for various info used in the page
    $scope.book = {
      routeId: null,
      boardStopId: null,
      alightStop: null,
      route: null,
      notExpired: true,
      bidPrice: null
    };

    $scope.priceInfo = {
      bidPrice : null,
    }

    $scope.book.routeId = +$stateParams.routeId;

    // var bidPromise, routePromise;
    // routePromise = KickstarterService.getLelongById($scope.book.routeId);
    // bidPromise = KickstarterService.getBidInfo($scope.book.routeId);

    $scope.$watchGroup([()=>KickstarterService.getLelongById($scope.book.routeId), ()=>KickstarterService.getBidInfo($scope.book.routeId)],([route, bid])=>{
      if (!route) return;
      $scope.book.route = route;
      if (!bid) return;
      $scope.book.bid = bid;
      if ($scope.book.route.notes && $scope.book.route.notes.lelongExpiry) {
       var now = new Date().getTime();
       var expiryTime = new Date($scope.book.route.notes.lelongExpiry).getTime();
       if (now > expiryTime) {
         $scope.book.notExpired = false;
       }
      }
      $scope.book.bidPrice = $scope.book.bid.bidPrice;
      $scope.book.boardStopId = +$scope.book.bid.boardStopId;
      $scope.book.alightStopId = +$scope.book.bid.alightStopId;
      $scope.book.boardStop = route.trips[0]
            .tripStops
            .find(ts => $scope.book.boardStopId == ts.stop.id);
      $scope.book.alightStop =route.trips[0]
            .tripStops
            .find(ts => $scope.book.alightStopId == ts.stop.id);
    })

    $scope.showTerms = async () => {
      if (!$scope.book.route.transportCompanyId) return;
      await CompanyService.showTerms($scope.book.route.transportCompanyId);
    }

  }
];
//
