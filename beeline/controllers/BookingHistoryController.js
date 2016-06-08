import qs from 'querystring'
import _ from 'lodash'

export default function($scope, UserService, RoutesService) {
  $scope.routesById = {}
  reset()

  $scope.$on('$ionicView.beforeEnter', () => {
    reset()
    $scope.loadMore()
  })

  function reset() {
    _.assign($scope, {
      hasMoreData: true,
      page: 1,
      perPage: 20,
      transactions: [],
    })

    RoutesService.getRoutes()
    .then((routes) => $scope.routesById = _.keyBy(routes, r => r.id))
  }

  var inFlight = {}

  $scope.loadMore = function () {
    if (inFlight[$scope.page]) {

    }
    else {
      inFlight[$scope.page] = UserService.beeline({
        method: 'GET',
        url: '/transactions/userHistory?' + qs.stringify({
          page: $scope.page,
          perPage: $scope.perPage,
        }),
      })
      .then((response) => {
        var newTransactions = response.data.transactions;

        if (newTransactions.length != $scope.perPage) {
          $scope.hasMoreData = false;
        }
        else {
          $scope.page++;
        }

        for (let t of newTransactions) {
          t.$items = _.groupBy(t.transactionItems, ti => ti.itemType)
        }

        $scope.transactions = $scope.transactions.concat(newTransactions)
        $scope.$broadcast('scroll.infiniteScrollComplete');
      })
    }
  }
}
