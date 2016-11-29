import {NetworkError} from '../shared/errors';
import {formatDate, formatTime, formatUTCDate, formatHHMM_ampm} from '../shared/format';
import loadingTemplate from '../templates/loading.html';
import assert from 'assert';

export default [
  '$rootScope','$scope','$state','$stateParams','$http','RoutesService','loadingSpinner',
  'UserService','KickstarterService','$cordovaSocialSharing',
  function(
    $rootScope,$scope,$state,$stateParams,$http,RoutesService,loadingSpinner,UserService,
    KickstarterService,$cordovaSocialSharing
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
    $scope.showCopy = !window.cordova || false;

    $scope.$watchGroup([()=>KickstarterService.getLelongById($scope.book.routeId), ()=>KickstarterService.getBidInfo($scope.book.routeId)],([route, bid])=>{
      if (!route) return;
      $scope.book.route = route;
      if (!bid) return;
      $scope.book.bidPrice = bid.bidPrice;
      $scope.book.boardStop = $scope.book.route.trips[0]
            .tripStops
            .find(ts => bid.boardStopId == ts.stop.id);
      $scope.book.alightStop =$scope.book.route.trips[0]
            .tripStops
            .find(ts => bid.alightStopId == ts.stop.id);
    });

    //if has cordova no need to show shareLink text area
    $scope.shareLink = "Hey, check out this new kickstart route from Beeline! https://app.beeline.sg/kickstarter/"+$scope.book.routeId ;

    $scope.shareAnywhere = function() {
      $cordovaSocialSharing.share("Hey, check out this new kickstart route from Beeline!",
        "New Beeline Kickstart Route", null, "https://app.beeline.sg/kickstarter/"+$scope.book.routeId);
   };

  }
];
//
