export default [
  "$scope",
  "$stateParams",
  "TicketService",
  "CompanyService",
  "TripService",
  "UserService",
  "RoutesService",
  "MapService",
  function(
    $scope,
    $stateParams,
    TicketService,
    CompanyService,
    TripService,
    UserService,
    RoutesService,
    MapService
  ) {
    $scope.disp = {
      code: null,
      vehicle: null,
      driver: null,
      tripStatus: null,
    }

    // Initialize the necessary basic data data
    $scope.user = UserService.getUser()

    $scope.showTerms = companyId => {
      CompanyService.showTerms(companyId)
    }

    const ticketPromise = TicketService.getTicketById(
      Number($stateParams.ticketId)
    )
    const routePromise = ticketPromise.then(ticket => {
      return RoutesService.getRoute(Number(ticket.boardStop.trip.routeId))
    })
    const companyPromise = routePromise.then(route => {
      return CompanyService.getCompany(Number(route.transportCompanyId))
    })

    const sentTripToMapView = () => {
      const trip = $scope.trip
      if (trip) {
        MapService.emit("ping-single-trip", [trip])
      }
    }

    ticketPromise.then(ticket => {
      $scope.ticket = ticket
      $scope.trip = ticket.boardStop.trip
      $scope.tripCode = ticket.tripCode
      sentTripToMapView()
    })
    routePromise.then(route => {
      $scope.route = route
    })
    companyPromise.then(company => {
      $scope.company = company
    })

    const listener = info => {
      $scope.disp = { ...info }
    }

    $scope.$on("$ionicView.afterEnter", () => {
      sentTripToMapView()
      MapService.emit("startTicketPingLoop")
      MapService.on("ticketInfo", listener)
    })

    $scope.$on("$ionicView.beforeLeave", () => {
      MapService.emit("killTicketPingLoop")
      MapService.removeListener("ticketInfo", listener)
    })
  },
]
