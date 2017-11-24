export default [
  '$scope',
  '$stateParams',
  'TicketService',
  'CompanyService',
  'TripService',
  'UserService',
  'RoutesService',
  'MapService',
  function (
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

    $scope.showTerms = (companyId) => {
      CompanyService.showTerms(companyId)
    }

    const ticketPromise = TicketService.getTicketById(
      Number($stateParams.ticketId)
    )
    const tripPromise = ticketPromise.then((ticket) => {
      return TripService.getTripData(Number(ticket.alightStop.tripId))
    })
    const routePromise = tripPromise.then((trip) => {
      return RoutesService.getRoute(Number(trip.routeId))
    })
    const companyPromise = routePromise.then((route) => {
      return CompanyService.getCompany(Number(route.transportCompanyId))
    })
    ticketPromise.then((ticket) => {
      $scope.ticket = ticket
    })

    function sentTripToMapView () {
      const trip = $scope.trip
      if (trip) {
        MapService.emit('ping-single-trip', [trip])
      }
    }

    tripPromise.then((trip) => {
      $scope.trip = trip
      sentTripToMapView()
    })

    routePromise.then((route) => {
      $scope.route = route
    })
    companyPromise.then((company) => {
      $scope.company = company
    })

    const listener = (info) => {
      $scope.disp = {...info}
    }

    $scope.$on('$ionicView.afterEnter', () => {
      sentTripToMapView()
      MapService.emit('startTicketPingLoop')
      MapService.on('ticketInfo', listener)
    })

    $scope.$on('$ionicView.beforeLeave', () => {
      MapService.emit('killTicketPingLoop')
      MapService.removeListener('ticketInfo', listener)
    })
  },
]
