import priceCalculatorTemplate from "./priceCalculator.html"
import assert from "assert"
import _ from "lodash"

angular.module("beeline").directive("priceCalculator", [
  "BookingService",
  "RoutesService",
  "UserService",
  "CreditsService",
  function(BookingService, RoutesService, UserService, CreditsService) {
    return {
      restrict: "E",
      template: priceCalculatorTemplate,
      scope: {
        booking: "=",
      },
      controller: [
        "$scope",
        function($scope) {
          $scope.isCalculating = 0

          const stopCalculating = function() {
            $scope.isCalculating = Math.max(0, $scope.isCalculating - 1)
            $scope.$emit("priceCalculator.done")
          }

          $scope.updatePromoCode = function(promoCode) {
            $scope.booking.promoCode = promoCode
          }

          $scope.$watch(
            () => UserService.getUser(),
            user => {
              $scope.isLoggedIn = !!user
              CreditsService.fetchUserCredits().then(userCredits => {
                $scope.userCredits = userCredits
              })

              CreditsService.fetchReferralCredits().then(referralCredits => {
                $scope.referralCredits = referralCredits
              })

              // update ridesRemaining when user login at the booking summary page
              RoutesService.fetchRoutePassCount().then(routePassCountMap => {
                assert($scope.booking.routeId)
                if (!$scope.booking.route) {
                  RoutesService.getRoute($scope.booking.routeId).then(route => {
                    $scope.booking.route = route
                    if (routePassCountMap) {
                      $scope.booking.route.ridesRemaining =
                        routePassCountMap[$scope.booking.routeId]
                      $scope.booking.applyRoutePass =
                        $scope.booking.route.ridesRemaining > 0
                    }
                  })
                } else {
                  if (routePassCountMap) {
                    $scope.booking.route.ridesRemaining =
                      routePassCountMap[$scope.booking.routeId]
                    $scope.booking.applyRoutePass =
                      $scope.booking.route.ridesRemaining > 0
                  }
                }
              })
            }
          )
          /**
           * Recompute prices whenever relevant inputs change
           */
          const recomputePrices = async function recomputePrices() {
            assert($scope.booking.routeId)
            if (!$scope.booking.route) {
              $scope.booking.route = await RoutesService.getRoute(
                $scope.booking.routeId
              )
              let routeToRidesRemainingMap = await RoutesService.fetchRoutePassCount()
              $scope.booking.route.ridesRemaining =
                routeToRidesRemainingMap[$scope.booking.routeId]
            }

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
                if (promise != latestRequest) {
                  return
                }
                $scope.priceInfo = priceInfo
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
                $scope.errorMessage = error.data.message
              })
              .then(stopCalculating)

            latestRequest = promise
          }

          let latestRequest = null
          $scope.$watch(
            () =>
              _.pick($scope.booking, [
                "selectedDates",
                "applyRoutePass",
                "applyCredits",
                "applyReferralCredits",
                "promoCode",
              ]),
            recomputePrices,
            true
          )

          $scope.$on("priceCalculator.recomputePrices", recomputePrices)

          $scope.removePromoCode = function() {
            $scope.booking.promoCode = null
          }
        },
      ],
    }
  },
])
