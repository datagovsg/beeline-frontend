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

    var bidPromise, routePromise;
    routePromise = KickstarterService.getLelongById($scope.book.routeId);
    bidPromise = KickstarterService.getBidInfo($scope.book.routeId);

    Promise.all([routePromise, bidPromise]).then(([route, bid])=>{
      $scope.book.route = route;
      $scope.book.bid = bid.bid;
      console.log("BID");
      console.log($scope.book.bid);
      if ($scope.book.route.notes && $scope.book.route.notes.lelongExpiry) {
       var now = new Date().getTime();
       var expiryTime = new Date($scope.book.route.notes.lelongExpiry).getTime();
       if (now > expiryTime) {
         $scope.book.notExpired = false;
       }
      }
      $scope.book.bidPrice = $scope.book.bid.userOptions.price;
      $scope.book.boardStopId = +$scope.book.bid.tickets[0].boardStop.stopId;
      $scope.book.alightStopId = +$scope.book.bid.tickets[0].alightStop.stopId;
      $scope.book.boardStop = route.trips[0]
            .tripStops
            .filter(ts => $scope.book.boardStopId == ts.stop.id)[0];
      $scope.book.alightStop =route.trips[0]
            .tripStops
            .filter(ts => $scope.book.alightStopId == ts.stop.id)[0];
      console.log($scope.book.boardStop)
      console.log($scope.book.alightStop)
    })

    $scope.showTerms = async () => {
      if (!$scope.book.route.transportCompanyId) return;
      await CompanyService.showTerms($scope.book.route.transportCompanyId);
    }

  }
];
//
