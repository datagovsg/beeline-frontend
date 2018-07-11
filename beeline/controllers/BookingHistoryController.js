import qs from 'querystring'
import _ from 'lodash'
import moment from 'moment'

export default [
  '$scope',
  'RequestService',
  'RoutesService',
  function ($scope, RequestService, RoutesService) {
    // ------------------------------------------------------------------------
    // Helper functions
    // ------------------------------------------------------------------------
    const reset = function reset () {
      _.assign($scope, {
        hasMoreData: true,
        page: 1,
        perPage: 80,
        transactions: null,
      })
    }

    const calcTotal = function calcTotal (payments) {
      return Math.abs(
        payments.map(payment => payment.debitF).reduce((acc, val) => acc + val)
      )
    }

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    let inFlight = false

    $scope.activeTab = 'payments'

    // ------------------------------------------------------------------------
    // Ionic events
    // ------------------------------------------------------------------------
    $scope.$on('$ionicView.beforeEnter', () => {
      reset()
      $scope.loadMore()
    })

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.loadMore = function () {
      if (inFlight) {
        return
      }

      inFlight = true
      RequestService.beeline({
        method: 'GET',
        url:
          '/transactions/user_history?' +
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

          $scope.transactions = $scope.transactions || []
          $scope.transactions = $scope.transactions.concat(newTransactions)

          $scope.transactions = $scope.transactions.map(txn => {
            // Set txn itemDetail - 5 types of txns
            // 1. Ticket sale
            // 2. Ticket refund
            // 3. Route pass sale
            // 4. Route pass refund
            // 5. Crowdstart conversion
            if (txn.itemsByType.ticketSale || txn.itemsByType.ticketRefund) {
              txn.itemDetail =
                txn.itemsByType.deal.length +
                ' ticket' +
                (txn.itemsByType.deal.length > 1 ? 's' : '') +
                ' - ' +
                txn.itemsByType.deal
                  .map(dealItem =>
                    moment(dealItem.dealItem.boardStop.trip.date)
                  )
                  .sort((a, b) => a - b)
                  .map(date => date.format('DD MMM'))
                  .join(', ')
              txn.route = txn.itemsByType.deal[0].dealItem.boardStop.trip.route
              if (txn.itemsByType.ticketSale) {
                txn.paid = true
                txn.totalAmount = calcTotal(txn.itemsByType.payment)
              } else {
                txn.paid = false
                txn.totalAmount = calcTotal(txn.itemsByType.deal)
              }
            } else if (txn.type === 'routePassPurchase') {
              txn.itemDetail = txn.itemsByType.deal.length + ' route passes'
              txn.paid = true
              txn.totalAmount = calcTotal(txn.itemsByType.payment)
              txn.route = txn.itemsByType.deal[0].dealItem.route
            } else if (
              txn.type === 'refundPayment' &&
              txn.itemsByType.routePass
            ) {
              txn.itemDetail = '1 route pass'
              txn.paid = false
              txn.totalAmount = calcTotal(txn.itemsByType.deal)
              txn.route = txn.itemsByType.deal[0].dealItem.route
            } else if (txn.type === 'conversion') {
              txn.itemDetail =
                'Activate crowdstart route with ' +
                txn.itemsByType.routePass.length +
                ' route passes'
              txn.paid = true
              txn.totalAmount = calcTotal(txn.itemsByType.payment)
              txn.route = txn.itemsByType.deal[0].dealItem.route
            }

            return txn
          })
        })
        .then(null, error => {
          inFlight = false
          console.error(error)
        })
    }

    $scope.setActiveTab = function (tapped) {
      $scope.activeTab = tapped
    }

    $scope.tabMatches = function (transaction) {
      let activeTab = $scope.activeTab
      return (
        (transaction.type === 'refundPayment' && activeTab === 'refunds') ||
        (transaction.type !== 'refundPayment' && activeTab === 'payments')
      )
    }

    $scope.hasResults = function () {
      return (
        $scope.transactions &&
        $scope.transactions.filter($scope.tabMatches).length === 0
      )
    }
  },
]
