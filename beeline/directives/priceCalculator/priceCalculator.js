import priceCalculatorTemplate from './priceCalculator.html';
import assert from 'assert';
const queryString = require('querystring')

export default [
  'BookingService', 'RoutesService', 'UserService', '$ionicPopup', 'CreditsService',
  function(BookingService, RoutesService, UserService, $ionicPopup, CreditsService) {
    return {
      restrict: 'E',
      template: priceCalculatorTemplate,
      scope: {
        'booking': '=',
        'price': '=?',
        'showRouteCredits': '<',
      },
      link: function(scope, elem, attr) {
        scope.isCalculating = 0;

        function stopCalculating() {
          scope.isCalculating = Math.max(0, scope.isCalculating - 1);
          scope.$emit('priceCalculator.done')
        }

        // // makes the promo code that's selected in the radio list 
        // // the primary promo code to be used for the current purchase
        // scope.selectCode = function(promoCode){
        //   scope.booking.promoCode = promoCode
        // }

        // // Saves promo codes entered by users into notes for future use and
        // // makes it the primary promo code to be used for the current purchase
        // // TODO: Currently only handles referral codes. Implement for other promotion codes
        // scope.addPromoCode = async function() {
        //   try{
        //     if(scope.booking.currentPromoCode.length > 0){
        //       // retrieve refCode owner data
        //       var refCode = scope.booking.currentPromoCode
        //       var query = queryString.stringify({code: refCode})
              
        //       var refCodeOwner = await UserService.beeline({
        //         method: 'GET',
        //         url: '/promotions/refCodeOwner?'+query,
        //       });
        //       var user = UserService.getUser();

        //       // if code proves to be valid (has data)
        //       if(refCodeOwner.data && refCodeOwner.data.referrerId !== user.id) {
        //         var codeOwnerMap = (await UserService.saveRefCode(refCode, refCodeOwner.data)).data
        //         scope.booking.promoCodes = scope.booking.processCodeOwnerMap(codeOwnerMap)
        //       }

        //       scope.booking.promoCode = refCode
            
        //     } else if(scope.booking.promoCodes && scope.booking.promoCodes.length > 0){
        //         scope.booking.promoCode = scope.booking.promoCodes[0].refCode
        //     } else {
        //       scope.booking.promoCode = undefined  
        //     }
        //   } catch(err){
        //     await $ionicPopup.alert({
        //       title: 'Error processing input',
        //       template: err.data.message,
        //     })
        //   } 
        // }

        var userCreditsPromise = CreditsService.fetchUserCredits().then((userCredits) => {
          console.log("UserCreds:", userCredits)
          scope.userCredits = userCredits
        });
        var referralCreditsPromise = CreditsService.fetchReferralCredits().then((referralCredits) => {
          console.log("ReferralCreds:", referralCredits)
          scope.referralCredits = referralCredits
        });

        var latestRequest = null;
        scope.$watch(
          () => _.pick(scope.booking, ['selectedDates', 'useRouteCredits', 'applyCredits', 'useReferralCredits', 'promoCode'/* , qty */]),
          async function () {
            assert(scope.booking.routeId);
            if (!scope.booking.route) {
              scope.booking.route = await RoutesService.getRoute(scope.booking.routeId)
              let routeToRidesRemainingMap = await RoutesService.fetchRoutePassCount()
              scope.booking.route.ridesRemaining = routeToRidesRemainingMap[scope.booking.routeId]
            }

            // Provide a price summary first (don't count total due)
            // This allows the page to resize earlier, so that when
            // users scroll down the bounce works ok.
            scope.priceInfo = scope.priceInfo || {};
            scope.priceInfo.pricesPerTrip = BookingService.summarizePrices(scope.booking);

            scope.isCalculating++;
            var promise = BookingService.computePriceInfo(scope.booking)
            .then((priceInfo) => {
              // Check to ensure that the order of
              // replies don't affect the result
              if (promise != latestRequest)
                return;
              scope.priceInfo = priceInfo;
              scope.price = priceInfo.totalDue;
              scope.ridesUsed = scope.booking.useRouteCredits 
                ? Math.min(scope.booking.route.ridesRemaining, priceInfo.tripCount)
                : 0
              scope.errorMessage = null;
            })
            .catch((error) => {
              scope.priceInfo = {};
              scope.price = undefined;
              scope.errorMessage = error.data.message;
            })
            .then(stopCalculating);

            latestRequest = promise;
          }, true);
      }
    };
  }];
