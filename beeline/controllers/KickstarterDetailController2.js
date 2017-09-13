import {NetworkError} from '../shared/errors';
import {formatDate, formatTime, formatUTCDate, formatHHMM_ampm} from '../shared/format';
import loadingTemplate from '../templates/loading.html';
import processingPaymentsTemplate from '../templates/processing-payments.html';
import assert from 'assert';
import busStopListTemplate from '../templates/bus-stop-list.html';

export default [
  '$rootScope','$scope','$interpolate','$state','$stateParams','$ionicModal',
  '$http','$cordovaGeolocation','BookingService','RoutesService','uiGmapGoogleMapApi',
  'MapOptions','loadingSpinner','UserService','StripeService','$ionicLoading','$ionicPopup',
  'KickstarterService','SharedVariableService',
  function(
    $rootScope,$scope,$interpolate,$state,$stateParams,$ionicModal,$http,
    $cordovaGeolocation,BookingService,RoutesService,uiGmapGoogleMapApi,
    MapOptions,loadingSpinner,UserService,StripeService,$ionicLoading,$ionicPopup,
    KickstarterService, SharedVariableService
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
    $scope.disp = {
      popupStop: null,
      popupStopType: null,
      parentScope: $scope,
    }
    $scope.mapObject = {
      stops: [],
      routePath: [],
      alightStop: null,
      boardStop: null,
      pingTrips: [],
      allRecentPings: [],
    }


    $scope.book.routeId = +$stateParams.routeId;

    $scope.$watch(()=>KickstarterService.getCrowdstartById($scope.book.routeId), (route)=>{
      if (!route) return;
      $scope.book.route = route;
      $scope.book.bidOptions = route.notes.tier;
      [$scope.book.boardStops, $scope.book.alightStops] = BookingService.computeStops($scope.book.route.trips);
      $scope.busStops = $scope.book.boardStops.concat($scope.book.alightStops);
      $scope.mapObject.stops = $scope.busStops;
      if (route.path) {
        RoutesService.decodeRoutePath(route.path)
          .then((decodedPath) => {
            $scope.mapObject.routePath = decodedPath
            SharedVariableService.setRoutePath(decodedPath)
          })
          .catch(() => {
            $scope.mapObject.routePath = []
            SharedVariableService.setRoutePath([])
          })
      }
      SharedVariableService.set($scope.mapObject)
    })



    $scope.$on('$ionicView.afterEnter', () => {
      SharedVariableService.set($scope.mapObject)
    });

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

    $scope.closeWindow = function () {
      $scope.disp.popupStop = null;
    }

    $scope.modal = $ionicModal.fromTemplate(busStopListTemplate, {
      scope: $scope,
      animation: 'slide-in-up',
    })

    $scope.showStops = function(){
      $scope.modal.show();

    };
    $scope.close = function() {
      $scope.modal.hide();
    };
    // Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });

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
