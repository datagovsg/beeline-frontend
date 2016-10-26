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

    //if has cordova no need to show shareLink text area
    $scope.shareLink = "Check out this new kickstart route from Beeline! https://app.beeline.sg/kickstarter/"+$scope.book.routeId ;

    $scope.shareAnywhere = function() {
      $cordovaSocialSharing.share("Check out this new kickstart route from Beeline!",
        "New Beeline Kickstart Route", null, "https://app.beeline.sg/kickstarter/"+$scope.book.routeId);
   };

  }
];
//
