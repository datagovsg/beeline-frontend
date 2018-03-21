import ticketDetailModalTemplate from "../templates/ticket-detail-modal.html"

export default [
  "$scope",
  "TicketService",
  "UserService",
  "loadingSpinner",
  "$ionicModal",
  "$rootScope",
  function(
    $scope,
    TicketService,
    UserService,
    loadingSpinner,
    $ionicModal,
    $rootScope
  ) {
    // ------------------------------------------------------------------------
    // Data Loading
    // ------------------------------------------------------------------------
    let normalRoutesPromise = Promise.resolve(null)
    $scope.tickets = {
      today: null,
      soon: null,
    }

    // ------------------------------------------------------------------------
    // Ionic events
    // ------------------------------------------------------------------------
    $scope.$on("$ionicView.afterEnter", () => {
      loadingSpinner(normalRoutesPromise)
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
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

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    // Track the login state of the user service
    $scope.logIn = function() {
      UserService.promptLogIn()
    }

    $scope.popupTicketModal = function(ticket) {
      let scope = $rootScope.$new()
      scope.ticketId = ticket.id
      scope.functions = {}
      let modal = $ionicModal.fromTemplate(ticketDetailModalTemplate, {
        scope: scope,
        animation: "slide-in-up",
      })
      scope.modal = modal
      modal.show()
    }

    $scope.refreshTickets = refreshNormalTickets

    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------
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
