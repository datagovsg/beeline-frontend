import {NetworkError} from '../shared/errors';
import {formatDate, formatTime, formatUTCDate, formatHHMM_ampm} from '../shared/format';
import loadingTemplate from '../templates/loading.html';
import assert from 'assert';

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
      alightStopId: null,
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
      hasCreditInfo: false,
      brand: null,
      last4Digtis: null,
    }

    $scope.book.routeId = +$stateParams.routeId;
    $scope.priceInfo.bidPrice = +$stateParams.bidPrice;


    $scope.$watch(()=>KickstarterService.getLelongById($scope.book.routeId), (route)=>{
      if (!route) return;
      $scope.book.route = route;
      //give 1st and last stop as board and alight stop for fake ticket
      $scope.book.boardStopId = _.first(route.trips[0].tripStops).id;
      $scope.book.alightStopId =_.last(route.trips[0].tripStops).id;
      $scope.priceInfo.tripCount = $scope.book.route.notes.noPasses || 0;
      $scope.priceInfo.totalDue = $scope.priceInfo.bidPrice * $scope.priceInfo.tripCount;
      $scope.$watch('priceInfo.bidPrice',(price)=>{
        $scope.priceInfo.tripCount = $scope.book.route.notes.noPasses || 0;
        $scope.priceInfo.totalDue = price * $scope.priceInfo.tripCount;
      })
    });

    $scope.$watch(() => UserService.getUser(), async(user) => {
      $scope.isLoggedIn = user ? true : false;
      $scope.user = user;
      if ($scope.isLoggedIn) {
        $scope.data.hasCreditInfo = ($scope.user && $scope.user.savedPaymentInfo && $scope.user.savedPaymentInfo.sources.data.length > 0);
        if ($scope.data.hasCreditInfo) {
          $scope.$watch(()=>UserService.getUser().savedPaymentInfo, (paymentInfo)=>{
            $scope.data.brand = paymentInfo.sources.data[0].brand;
            $scope.data.last4Digtis = paymentInfo.sources.data[0].last4;
          });
        }
      }
    });

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

        if (!$scope.data.hasCreditInfo) {
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
        })
        $state.go('tabs.kickstarter-commit', { routeId: $scope.book.routeId});
      }catch(err){
        await $ionicPopup.alert({
          title: 'Error processing bid',
          template: `
          <div> There was an error creating the bid. ${err && err.data && err.data.message} Please try again later.</div>
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
      try {
        const stripeToken = await StripeService.promptForToken(null, null, true);

        if (!stripeToken) return;

        const user = $scope.user;

        var result = await loadingSpinner(
          UserService.updatePaymentInfo(stripeToken.id)
        );
      } catch(error) {
        console.log(err);
        throw new Error(`Error saving credit card details. ${_.get(err, 'data.message')}`)
      }
    }
  }
];
//
