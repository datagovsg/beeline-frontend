import {NetworkError} from '../shared/errors';
import {formatDate, formatTime, formatUTCDate, formatHHMM_ampm} from '../shared/format';
import loadingTemplate from '../templates/loading.html';
import processingPaymentsTemplate from '../templates/processing-payments.html';
import assert from 'assert';

export default [
  '$rootScope','$scope','$interpolate','$state','$stateParams','$ionicModal',
  '$http','$cordovaGeolocation','BookingService','RoutesService','uiGmapGoogleMapApi',
  'MapOptions','loadingSpinner','UserService','StripeService','$ionicLoading','$ionicPopup',
  'KickstarterService',
  function(
    $rootScope,$scope,$interpolate,$state,$stateParams,$ionicModal,$http,
    $cordovaGeolocation,BookingService,RoutesService,uiGmapGoogleMapApi,
    MapOptions,loadingSpinner,UserService,StripeService,$ionicLoading,$ionicPopup,
    KickstarterService
  ) {
    // Gmap default settings
    $scope.map = MapOptions.defaultMapOptions();
    $scope.routePath = [];

    // Default settings for various info used in the page
    $scope.book = {
      routeId: null,
      route: null,
      bid: null,
      calculatedAmount: '',
      bidPrice: null,
      notExpired: true
    };
    $scope.disp = {
      popupStop: null,
      popupStopType: null,
      parentScope: $scope,
    }

    // Resolved when the map is initialized
    var gmapIsReady = new Promise((resolve, reject) => {
      var resolved = false;
      $scope.$watch('map.control.getGMap', function() {
        if ($scope.map.control.getGMap) {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        }
      });
    });

    var routePromise;

    $scope.book.routeId = +$stateParams.routeId;

    $scope.$watch(()=>KickstarterService.getLelongById($scope.book.routeId), (route)=>{
      if (!route) return;
      $scope.book.route = route;
      $scope.book.bidOptions = route.notes.tier;
      computeStops();
      panToStops();
      if (route.notes && route.notes.lelongExpiry) {
       var now = new Date().getTime();
       var expiryTime = new Date(route.notes.lelongExpiry).getTime();
       if (now > expiryTime) {
         $scope.book.notExpired = false;
       }
      }
    })

    $scope.$on('$ionicView.afterEnter', () => {
      loadingSpinner(Promise.all([gmapIsReady])
      .then(() => {
        var gmap = $scope.map.control.getGMap();
        google.maps.event.trigger(gmap, 'resize');
      }));
    });

    gmapIsReady.then(function() {
      MapOptions.disableMapLinks();
    });

    $scope.$watch('book.route.path', (path) => {
      if (!path) {
        $scope.routePath = [];
      }
      else {
        RoutesService.decodeRoutePath(path)
        .then((decodedPath) => $scope.routePath = decodedPath)
        .catch(() => $scope.routePath = []);
      }
    })

    $scope.applyTapBoard = function (stop) {
      $scope.disp.popupStopType = "pickup";
      $scope.disp.popupStop = stop;
      $scope.$digest();
    }
    $scope.applyTapAlight = function (stop) {
      $scope.disp.popupStopType = "dropoff";
      $scope.disp.popupStop = stop;
      $scope.$digest();
    }
    $scope.setStop = function (stop, type) {
      if (type === 'pickup') {
        $scope.book.boardStop = stop;
      }
      else {
        $scope.book.alightStop = stop;
      }
      $scope.disp.popupStop = null;
    }
    $scope.closeWindow = function () {
      $scope.disp.popupStop = null;
    }

    /* Pans to the stops on the screen */
    function panToStops() {
      var stops = [];
      stops = $scope.book.boardStops.concat($scope.book.alightStops);

      if (stops.length == 0) {
        return;
      }
      var bounds = new google.maps.LatLngBounds();
      for (let s of stops) {
        bounds.extend(new google.maps.LatLng(
          s.coordinates.coordinates[1],
          s.coordinates.coordinates[0]
        ));
      }
      $scope.map.control.getGMap().fitBounds(bounds);
    }

    /** Summarizes the stops from trips by comparing their stop location and time */
    function computeStops() {
      var trips = $scope.book.route.trips;
      var [boardStops, alightStops] = BookingService.computeStops(trips);
      $scope.book.boardStops = boardStops;
      $scope.book.alightStops = alightStops;
    }

    // $scope.deleteBid = async function(){
    //   try {
    //     await loadingSpinner(KickstarterService.deleteBid($scope.book.routeId));
    //
    //     await $ionicPopup.alert({
    //       title: 'Deleted',
    //     });
    //     $scope.$apply(() => {
    //       $scope.book.isBid = false;
    //       //TODO: refresh the lelong routes and bids info
    //       decreaseBidNo($scope.book.route, $scope.book.bidPrice);
    //     })
    //   } catch(err) {
    //     await $ionicPopup.alert({
    //       title: 'Error processing delete',
    //       template: err.data.message,
    //     })
    //   }
    // }
  }
];
//
