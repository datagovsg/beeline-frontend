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
  'KickstarterService',
  function(
    $rootScope,$scope,$interpolate,$state,$stateParams,$ionicModal,$http,
    $cordovaGeolocation,BookingService,RoutesService,uiGmapGoogleMapApi,
    MapOptions,loadingSpinner,UserService,StripeService,$ionicLoading,$ionicPopup,
    KickstarterService
  ) {
    // Gmap default settings
    $scope.map = MapOptions.defaultMapOptions();
    $scope.modalMap = MapOptions.defaultMapOptions();

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
      [$scope.book.boardStops, $scope.book.alightStops] = BookingService.computeStops($scope.book.route.trips);
      $scope.busStops = $scope.book.boardStops.concat($scope.book.alightStops);
      // $scope.panToStops($scope.map.control.getGMap(), $scope.busStops);
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

    $scope.$watchGroup(['busStops',()=>_.get($scope.map, 'control.getGMap()')],([stops, gmap])=>{
      if (stops && gmap) {
        $scope.panToStops(gmap, stops);
      }
    })

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

    $scope.closeWindow = function () {
      $scope.disp.popupStop = null;
    }

    $scope.modal = $ionicModal.fromTemplate(busStopListTemplate, {
      scope: $scope,
      animation: 'slide-in-up',
    })

    $scope.showStops = function(){
      $scope.modal.show();

      $scope.$watch(()=>_.get($scope.modalMap, 'control.getGMap()'), function(modalMap) {
        if (modalMap) {
          google.maps.event.trigger(modalMap, 'resize');
          //set modalMap bound
          $scope.panToStops(modalMap, $scope.busStops);
        }
      });
    };
    $scope.close = function() {
      $scope.modal.hide();
    };
    // Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });

    /* Pans to the stops on the screen */
    $scope.panToStops = function(gmap, stops) {
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
      gmap.fitBounds(bounds);
    };

    // pans to single stop
    $scope.panToStop = function(gmap, stop) {
      if (!stop) return;
      $scope.book.chosenStop = stop;
      gmap.panTo({
        lat: stop.coordinates.coordinates[1],
        lng: stop.coordinates.coordinates[0],
      })
      gmap.setZoom(17);
    }

    $scope.updateSelection = function(position, tiers, price) {
      _.forEach(tiers, function(tier, index){
        if (position == index) {
          $scope.book.bidPrice = $scope.book.bidPrice == price ? null : price;
        }
      })
    }

    $scope.goBack = function() {
      if (!$stateParams.backPage) {
        $state.go('tabs.crowdstart')
      } else {
        $state.go($stateParams.backPage)
      }
    }
  }
];
//
