import qs from 'querystring'
import _ from 'lodash'

export default function($scope, UserService, RoutesService) {
  var routesPromise;
  $scope.routesById = {}

  $scope.$on('$ionicView.beforeEnter', () => {
    reset()
    $scope.loadMore()
  })

  function reset() {
    _.assign($scope, {
      hasMoreData: true,
      page: 1,
      perPage: 20,
      transactions: null,
    })

    routesPromise = RoutesService.getRoutes(true, {
      end_date: Date.now(),
      start_date: Date.now() - 365*24*60*60*1000
    })
    .then((routes) => {
      $scope.routesById = _.keyBy(routes, r => r.id);
      console.log($scope.routesById);
    })
  }

  var inFlight = false;

  $scope.loadMore = function () {
    if (inFlight) {
      return;
    }

    inFlight = true;
    UserService.beeline({
      method: 'GET',
      url: '/transactions/userHistory?' + qs.stringify({
        page: $scope.page,
        perPage: $scope.perPage,
      }),
    })
    .then((response) => {
      inFlight = false;
      var newTransactions = response.data.transactions;

      if (newTransactions.length != $scope.perPage) {
        $scope.hasMoreData = false;
      }
      else {
        $scope.page++;
      }

      for (let t of newTransactions) {
        t.itemsByType = _.groupBy(t.transactionItems, ti => ti.itemType)
      }

      // add route information to ticket sale items
      routesPromise.then(() => {
        for (let t of newTransactions) {
          for (let ticketSaleItem of t.itemsByType.ticketSale || []) {
            ticketSaleItem.route = $scope.routesById[ticketSaleItem.ticketSale.boardStop.trip.routeId]
          }
          for (let ticketRefundItem of t.itemsByType.ticketRefund || []) {
            ticketRefundItem.route = $scope.routesById[ticketRefundItem.ticketRefund.boardStop.trip.routeId]
          }
          for (let ticketExpenseItem of t.itemsByType.ticketExpense || []) {
            ticketExpenseItem.route = $scope.routesById[ticketExpenseItem.ticketExpense.boardStop.trip.routeId]
          }
        }
      })

      $scope.transactions = $scope.transactions || [];
      $scope.transactions = $scope.transactions.concat(newTransactions);
      $scope.$broadcast('scroll.infiniteScrollComplete');
    })
    .then(null, (error) => {
      inFlight = false;
    })
  }
}
