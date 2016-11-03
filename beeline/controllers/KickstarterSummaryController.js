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
      alightStop: null,
      route: null,
      notExpired: true,
      isBid: null,
    };
    $scope.priceInfo = {
      tripCount: null,
      bidPrice: null,
      totalDue: null
    };
    $scope.data = {
      hasNoCreditInfo: true
    }

    $scope.book.routeId = +$stateParams.routeId;
    $scope.book.boardStopId = +$stateParams.boardStop;
    $scope.book.alightStopId = +$stateParams.alightStop;
    $scope.priceInfo.bidPrice = +$stateParams.bidPrice;


    $scope.$watch(()=>KickstarterService.getLelongById($scope.book.routeId), (route)=>{

      $scope.book.route = route;
      $scope.book.boardStop = route.trips[0]
            .tripStops
            .filter(ts => $scope.book.boardStopId == ts.stop.id)[0];
      $scope.book.alightStop =route.trips[0]
            .tripStops
            .filter(ts => $scope.book.alightStopId == ts.stop.id)[0];

      if (route.notes && route.notes.lelongExpiry) {
       var now = new Date().getTime();
       var expiryTime = new Date(route.notes.lelongExpiry).getTime();
       if (now > expiryTime) {
         $scope.book.notExpired = false;
       }
      }
      $scope.priceInfo.tripCount = $scope.book.route.trips.length || 0;
      $scope.priceInfo.totalDue = $scope.priceInfo.bidPrice * $scope.priceInfo.tripCount;
      $scope.$watch('priceInfo.bidPrice',(price)=>{
        $scope.priceInfo.tripCount = $scope.book.route.trips.length || 0;
        $scope.priceInfo.totalDue = price * $scope.priceInfo.tripCount;
      })
    });

    $scope.$watch(() => UserService.getUser(), async(user) => {
      $scope.isLoggedIn = user ? true : false;
      $scope.user = user;
      if ($scope.isLoggedIn) {
        $scope.data.hasNoCreditInfo = ($scope.user && $scope.user.savedPaymentInfo && $scope.user.savedPaymentInfo.sources.data.length > 0) ? false : true;
      }
    });

    $scope.$watch(()=>KickstarterService.isBid($scope.book.routeId), (isBid)=>{
      $scope.book.isBid = isBid;
      if ($scope.book.isBid) {
        const bidInfo =  KickstarterService.getBidInfo($scope.book.routeId);
        $scope.priceInfo.bidPrice = bidInfo.bid.userOptions.price;
      }
    })

    $scope.showTerms = async () => {
      if (!$scope.book.route.transportCompanyId) return;
      await CompanyService.showTerms($scope.book.route.transportCompanyId);
    }


    $scope.login = function () {
      UserService.promptLogIn()
    }

    $scope.createBid = async function(){
      try {
        var bidPrice = $scope.priceInfo.bidPrice;
        // disable the button
        $scope.waitingForPaymentResult = true;

        if ($scope.data.hasNoCreditInfo) {
          const stripeToken = await StripeService.promptForToken(null, null, true);

          if (!stripeToken) return;

          await loadingSpinner(
            UserService.savePaymentInfo(stripeToken.id)
          );
        }

      } catch (err) {
        console.log(err);
        throw new Error(`Error saving credit card details. ${_.get(err, 'data.message')}`)
      }

      try {
        var bidResult = await loadingSpinner(KickstarterService.createBid($scope.book.route, $scope.book.boardStopId,
                                              $scope.book.alightStopId, bidPrice));
        await $ionicPopup.alert({
          title: 'Success',
        })
        $scope.$apply(() => {
          $scope.book.isBid = true;
          //TODO: important ! no. updated in kickstarter list however boardstop and alightstop is not updated when revisit
          increaseBidNo($scope.book.route, bidPrice);
        })
        $state.go('tabs.kickstarter-commit', { routeId: $scope.book.routeId});
      }catch(err){
        await $ionicPopup.alert({
          title: 'Error processing bid',
          template: `
          <div> There was an error creating the bid. {{err && err.data && err.data.message}} Please try again later.</div>
          `,
        })
        $state.go('tabs.kickstarter');
      }finally {
        $ionicLoading.hide();
        $scope.$apply(() => {
          $scope.waitingForPaymentResult = false;
        })
      }
    }

    //update the saving card info then place bid
    $scope.updateSavingCard = async function(){
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
        method: 'PUT',
        url: `/users/${user.id}/creditCards`,
        data: {
          stripeToken: stripeToken.id
        },
      }));

      if(result) {
        $scope.createBid();
      }

    }


  }
];
//
