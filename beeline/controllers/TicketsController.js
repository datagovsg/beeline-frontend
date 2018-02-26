export default [
  "$scope",
  "TicketService",
  "UserService",
  "loadingSpinner",
  function($scope, TicketService, UserService, loadingSpinner) {
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    let normalRoutesPromise = Promise.resolve(null)
    $scope.tickets = {
      today: [],
      soon: [],
    }

    // -------------------------------------------------------------------------
    // Ionic Events
    // -------------------------------------------------------------------------

    $scope.$on("$ionicView.afterEnter", () => {
      loadingSpinner(normalRoutesPromise)
    })

    // -------------------------------------------------------------------------
    // Watchers
    // -------------------------------------------------------------------------
    $scope.$watch(
      () => UserService.getUser() && UserService.getUser().id,
      () => {
        $scope.user = UserService.getUser()
        if ($scope.user) {
          $scope.refreshTickets(true)
        } else {
          $scope.refreshTickets()
        }
      }
    )

    $scope.$watch(
      () => TicketService.getShouldRefreshTickets(),
      value => {
        if (!value) return
        normalRoutesPromise = refreshNormalTickets(true)
      }
    )

    // -------------------------------------------------------------------------
    // UI Hooks
    // -------------------------------------------------------------------------

    // Track the login state of the user service
    $scope.logIn = function() {
      UserService.promptLogIn()
    }

    $scope.refreshTickets = refreshNormalTickets

    // -------------------------------------------------------------------------
    // Helper functions
    // -------------------------------------------------------------------------

    function refreshNormalTickets(ignoreCache) {
      return TicketService.getCategorizedTickets(ignoreCache)
        .then(categorizedTickets => {
          $scope.tickets.today = categorizedTickets.today
          $scope.tickets.soon = categorizedTickets.afterToday
          $scope.error = false
        })
        .catch(error => {
          $scope.error = true
        })
        .finally(() => {
          $scope.$broadcast("scroll.refreshComplete")
        })
    }
  },
]
