import priceCalculatorTemplate from './priceCalculator.html'
import assert from 'assert'
import _ from 'lodash'

angular.module('beeline').directive('priceCalculator', [
  'BookingService',
  'RoutesService',
  'UserService',
  function (BookingService, RoutesService, UserService) {
    return {
      restrict: 'E',
      template: priceCalculatorTemplate,
      scope: {
        booking: '=',
        price: '=?',
      },
      controller: [
        '$scope',
        function ($scope) {
          $scope.isCalculating = 0

          const stopCalculating = function () {
            $scope.isCalculating = Math.max(0, $scope.isCalculating - 1)
            $scope.$emit('priceCalculator.done')
          }

          $scope.updatePromoCode = function (promoCode) {
            $scope.booking.promoCode = promoCode
          }

          const toggleApplyRoutePass = async function toggleApplyRoutePass () {
            if (!$scope.booking.route) {
              assert($scope.booking.routeId)
              $scope.booking.route = await RoutesService.getRoute($scope.booking.routeId)
            }
            // update ridesRemaining when user login at the booking summary page
            // look up the route passes the user has, then tally up the
            // route passes remaining across the route's tags
            RoutesService.fetchRoutePasses().then(ridesRemainingMap => {
              if (ridesRemainingMap) {
                let ridesRemaining = 0
                $scope.booking.route.tags.forEach(tag => {
                  ridesRemaining += (ridesRemainingMap[tag] || 0)
                })
                $scope.booking.applyRoutePass = ridesRemaining > 0
                $scope.booking.route.ridesRemaining = ridesRemaining
              }
            })
          }
          $scope.$watch(
            () => UserService.getUser(),
            async user => {
              $scope.isLoggedIn = !!user
              await toggleApplyRoutePass()
            }
          )
          /**
           * Recompute prices whenever relevant inputs change
           */
          const recomputePrices = async function recomputePrices () {
            assert($scope.booking.routeId)
            await toggleApplyRoutePass()

            // Provide a price summary first (don't count total due)
            // This allows the page to resize earlier, so that when
            // users scroll down the bounce works ok.
            $scope.priceInfo = $scope.priceInfo || {}
            const pricesPerTrip = BookingService.summarizePrices($scope.booking)
            $scope.pricePerTrip = pricesPerTrip[0].price

            $scope.isCalculating++
            let promise = BookingService.computePriceInfo($scope.booking)
              .then(priceInfo => {
                // Check to ensure that the order of
                // replies don't affect the result
                if (promise !== latestRequest) {
                  return
                }
                $scope.priceInfo = priceInfo
                $scope.price = priceInfo.totals.payment.debit
                $scope.ridesUsed = $scope.booking.applyRoutePass
                  ? Math.min(
                    $scope.booking.route.ridesRemaining,
                    BookingService.getTripsFromBooking($scope.booking).length
                  )
                  : 0
                $scope.errorMessage = null
              })
              .catch(error => {
                $scope.priceInfo = {}
                $scope.price = undefined
                $scope.errorMessage = error.data.message
              })
              .then(stopCalculating)

            latestRequest = promise
          }

          let latestRequest = null
          $scope.$watch(
            () =>
              _.pick($scope.booking, [
                'selectedDates',
                'applyRoutePass',
                'promoCode',
              ]),
            recomputePrices,
            true
          )

          $scope.$on('priceCalculator.recomputePrices', recomputePrices)

          $scope.removePromoCode = function () {
            $scope.booking.promoCode = null
          }
        },
      ],
    }
  },
])
