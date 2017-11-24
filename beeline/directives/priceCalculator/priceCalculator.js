import priceCalculatorTemplate from './priceCalculator.html'
import assert from 'assert'
const queryString = require('querystring')

export default [
  'BookingService', 'RoutesService', 'UserService', '$ionicPopup', 'CreditsService',
  function (BookingService, RoutesService, UserService, $ionicPopup, CreditsService) {
    return {
      restrict: 'E',
      template: priceCalculatorTemplate,
      scope: {
        'booking': '=',
        'price': '=?',
      },
      controller: ['$scope', function ($scope) {
        $scope.isCalculating = 0

        function stopCalculating () {
          $scope.isCalculating = Math.max(0, $scope.isCalculating - 1)
          $scope.$emit('priceCalculator.done')
        }

        $scope.updatePromoCode = function (promoCode) {
          $scope.booking.promoCode = promoCode
        }

        $scope.$watch(()=>UserService.getUser(), (user)=>{
          $scope.isLoggedIn = !!user
          CreditsService.fetchUserCredits().then((userCredits) => {
            $scope.userCredits = userCredits
          })

          CreditsService.fetchReferralCredits().then((referralCredits) => {
            $scope.referralCredits = referralCredits
          })

          // update ridesRemaining when user login at the booking summary page
          RoutesService.fetchRoutePassCount().then((routePassCountMap) => {
            assert($scope.booking.routeId)
            if (!$scope.booking.route) {
              RoutesService.getRoute($scope.booking.routeId).then((route)=>{
                $scope.booking.route = route
                if (routePassCountMap) {
                  $scope.booking.route.ridesRemaining = routePassCountMap[$scope.booking.routeId]
                  $scope.booking.applyRoutePass = ($scope.booking.route.ridesRemaining > 0)
                }
              })
            } else {
              if (routePassCountMap) {
                $scope.booking.route.ridesRemaining = routePassCountMap[$scope.booking.routeId]
                $scope.booking.applyRoutePass = ($scope.booking.route.ridesRemaining > 0)
              }
            }
          })
        })

        async function recomputePrices () {
          assert($scope.booking.routeId)
          if (!$scope.booking.route) {
            $scope.booking.route = await RoutesService.getRoute($scope.booking.routeId)
            let routeToRidesRemainingMap = await RoutesService.fetchRoutePassCount()
            $scope.booking.route.ridesRemaining = routeToRidesRemainingMap[$scope.booking.routeId]
          }

          // Provide a price summary first (don't count total due)
          // This allows the page to resize earlier, so that when
          // users scroll down the bounce works ok.
          $scope.priceInfo = $scope.priceInfo || {}
          $scope.priceInfo.pricesPerTrip = BookingService.summarizePrices($scope.booking)

          $scope.isCalculating++
          var promise = BookingService.computePriceInfo($scope.booking)
          .then((priceInfo) => {
            // Check to ensure that the order of
            // replies don't affect the result
            if (promise != latestRequest) {
return
}
            $scope.priceInfo = priceInfo
            $scope.price = priceInfo.totalDue
            $scope.ridesUsed = $scope.booking.applyRoutePass
              ? Math.min($scope.booking.route.ridesRemaining, priceInfo.tripCount)
              : 0
            $scope.totalRoutePassesUsed = _.sumBy($scope.priceInfo.routePass, (x) => - parseFloat(x.debit))
            $scope.errorMessage = null
          })
          .catch((error) => {
            $scope.priceInfo = {}
            $scope.price = undefined
            $scope.errorMessage = error.data.message
          })
          .then(stopCalculating)

          latestRequest = promise
        }

        var latestRequest = null
        $scope.$watch(
          () => _.pick($scope.booking, ['selectedDates', 'applyRoutePass', 'applyCredits', 'applyReferralCredits', 'promoCode']),
          recomputePrices, true)

        $scope.$on(
          'priceCalculator.recomputePrices',
          recomputePrices)

        $scope.removePromoCode = function () {
          $scope.booking.promoCode = null
        }
      }],
    }
  }]
