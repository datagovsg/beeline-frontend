import {NetworkError} from '../shared/errors';
import {formatDate, formatTime, formatUTCDate, formatHHMM_ampm} from '../shared/format';
import loadingTemplate from '../templates/loading.html';
import processingPaymentsTemplate from '../templates/processing-payments.html';
import assert from 'assert';

var increaseBidNo = function(route, price) {
  for (let tier of route.notes.tier) {
    if (tier.price <= price) {
      tier.no++;
    }
  }
}

var decreaseBidNo = function(route, price) {
  for (let tier of route.notes.tier) {
    if (tier.price <= price) {
      tier.no--;
    }
  }
}

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
      isBid: false,
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

    routePromise = KickstarterService.getLelongById($scope.book.routeId);

    var stopOptions = {
      initialBoardStopId: $stateParams.boardStop ? parseInt($stateParams.boardStop) : undefined,
      initialAlightStopId: $stateParams.alightStop ? parseInt($stateParams.alightStop) : undefined,
    };
    routePromise.then((route) => {
      console.log("ROUTEBYID");
      console.log(route);
      $scope.book.route = route;
      $scope.book.bidOptions = $scope.book.route.notes.tier;
      computeStops(stopOptions);
      if (route.notes && route.notes.lelongExpiry) {
       var now = new Date().getTime();
       var expiryTime = new Date(route.notes.lelongExpiry).getTime();
       if (now > expiryTime) {
         $scope.book.notExpired = false;
       }
      }
    });

    $scope.$on('$ionicView.afterEnter', () => {
      loadingSpinner(Promise.all([gmapIsReady, routePromise])
      .then(() => {
        var gmap = $scope.map.control.getGMap();
        google.maps.event.trigger(gmap, 'resize');
        panToStops();
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
    function computeStops({initialBoardStopId, initialAlightStopId}) {
      var trips = $scope.book.route.trips;
      var [boardStops, alightStops] = BookingService.computeStops(trips);
      $scope.book.boardStops = boardStops;
      $scope.book.alightStops = alightStops;

      // Check that the boardStopIds are still valid
      if (typeof(initialBoardStopId) === 'number') {
        $scope.book.boardStop = boardStops.find(ts =>
            ts.id === initialBoardStopId);
      }
      // Check that the boardStopIds are still valid
      if (typeof(initialAlightStopId) === 'number') {
        $scope.book.alightStop = alightStops.find(ts =>
            ts.id === initialAlightStopId);
      }
    }

    $scope.$watch(() => UserService.getUser(), async(user) => {
      $scope.isLoggedIn = user ? true : false;
      $scope.user = user;
      if ($scope.isLoggedIn) {
        $scope.book.isBid = await KickstarterService.isBid($scope.book.routeId);
        console.log("ISBID");
        console.log($scope.book.isBid);
        if ($scope.book.isBid) {
          const bidInfo =  await KickstarterService.getBidInfo($scope.book.routeId);
          console.log("BIDINFO");
          console.log(bidInfo);
          $scope.book.bidPrice = bidInfo[0].bid.userOptions.price
        }
      }
    })

    $scope.login = function () {
      UserService.promptLogIn()
    }

    $scope.$watch('book.bid',(bid)=>{
      if (bid && $scope.book.route && $scope.book.route.notes &&  $scope.book.route.notes.tier) {
        console.log("ROUTE");
        console.log($scope.book.route.trips)
        console.log(bid);
        $scope.book.calculatedAmount = $scope.book.route.notes.tier[bid-1].price * 5;
        console.log($scope.book.calculatedAmount);
      }
    })

    function userHasNoCreditCard() {
      console.log("USER");
      console.log($scope.user);
      if ($scope.user && $scope.user.savedPaymentInfo && $scope.user.savedPaymentInfo.sources.data.length > 0) {
        return false;
      }
      return true;
    }

    $scope.createBid = async function(index){
      try {
        var bidPrice = $scope.book.route.notes.tier[index].price;
        // disable the button
        $scope.waitingForPaymentResult = true;

        if (userHasNoCreditCard()) {
          const stripeToken = await StripeService.promptForToken();
          if (!stripeToken){
            throw new Error("There was some difficulty contacting the payment gateway." +
              " Please check your Internet connection");
            return;
          }

          if (!('id' in stripeToken)) {
            alert("There was an error contacting Stripe");
            return;
          }
          const user = $scope.user;

          var result = await loadingSpinner(UserService.beeline({
            method: 'POST',
            url: `/users/${user.id}/creditCards`,
            data: {
              stripeToken: stripeToken.id
            },
          }));
        }

      } catch (err) {
        console.log(err);
        throw new Error(`Error saving credit card details. ${_.get(err, 'data.message')}`)
      }

      try {
        var bidResult = await loadingSpinner(KickstarterService.createBid($scope.book.route, $scope.book.boardStop.id,
                                              $scope.book.alightStop.id, bidPrice));
        await $ionicPopup.alert({
          title: 'Success',
        })
        $scope.$apply(() => {
          $scope.book.isBid = true;
          $scope.book.bidPrice = bidPrice;
          //TODO: important ! no. updated in kickstarter list however boardstop and alightstop is not updated when revisit
          increaseBidNo($scope.book.route, bidPrice);
        })
      }catch(err){
        await $ionicPopup.alert({
          title: 'Error processing bid',
          template: err.data.message,
        })
      }finally {
        $ionicLoading.hide();
        $scope.$apply(() => {
          $scope.waitingForPaymentResult = false;
        })
      }
    }

    $scope.deleteBid = async function(){
      try {
        await loadingSpinner(KickstarterService.deleteBid($scope.book.routeId));

        await $ionicPopup.alert({
          title: 'Deleted',
        });
        $scope.$apply(() => {
          $scope.book.isBid = false;
          //TODO: refresh the lelong routes and bids info
          decreaseBidNo($scope.book.route, $scope.book.bidPrice);
        })
      } catch(err) {
        await $ionicPopup.alert({
          title: 'Error processing delete',
          template: err.data.message,
        })
      }
    }
  }
];
//
