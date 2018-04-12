import qs from "querystring"
import _ from "lodash"

export default [
  "$scope",
  "RequestService",
  "RoutesService",
  function($scope, RequestService, RoutesService) {
    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    let routesPromise
    let inFlight = false
    $scope.routesById = {}

    // ------------------------------------------------------------------------
    // Ionic events
    // ------------------------------------------------------------------------
    $scope.$on("$ionicView.beforeEnter", () => {
      reset()
      $scope.loadMore()
    })

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.loadMore = function() {
      if (inFlight) {
        return
      }

      inFlight = true
      RequestService.beeline({
        method: "GET",
        url:
          "/transactions/user_history?" +
          qs.stringify({
            page: $scope.page,
            perPage: $scope.perPage,
            groupItemsByType: true,
          }),
      })
        .then(response => {
          inFlight = false
          const newTransactions = response.data.transactions

          if (newTransactions.length === $scope.perPage) {
            $scope.page++
          } else {
            $scope.hasMoreData = false
          }

          // add route information to ticket sale items and route credit items
          routesPromise.then(() => {
            for (let t of newTransactions) {
              for (const item of t.itemsByType.deal || []) {
                const tag = (item.routeCredits || item.routePass || {}).tag
                const ticket = item.ticketSale || item.ticketRefund || item.ticketExpense
                const routeId = tag
                  ? tag.substring(tag.indexOf("-") + 1)
                  : ticket.boardStop.trip.routeId
                item.route = $scope.routesById[routeId]
              }
            }
          })

          $scope.transactions = $scope.transactions || []
          $scope.transactions = $scope.transactions.concat(newTransactions)
          $scope.$broadcast("scroll.infiniteScrollComplete")
        })
        .then(null, error => {
          inFlight = false
        })
    }

    // ------------------------------------------------------------------------
    // Helper functions
    // ------------------------------------------------------------------------
    function reset() {
      _.assign($scope, {
        hasMoreData: true,
        page: 1,
        perPage: 20,
        transactions: null,
      })

      routesPromise = RoutesService.fetchRoutes(true, {
        endDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
        startDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
        tags: "[]",
      }).then(routes => {
        $scope.routesById = _.keyBy(routes, r => r.id)
      })
    }
  },
]
