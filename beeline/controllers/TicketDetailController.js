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
      vehicle: null,
      driver: null,
      tripStatus: null,
    }
    $scope.latestInfo = {
      vehicleId: null,
      driverId: null,
    }

    // Initialize the necessary basic data data
    $scope.user = UserService.getUser()

    $scope.showTerms = companyId => {
      CompanyService.showTerms(companyId)
    }

    const updateLatestInfo = id =>
      TripService.latestInfo(Number(id)).then(info => {
        $scope.disp = {
          vehicle:
            info &&
            info.trip &&
            info.trip.vehicle &&
            info.trip.vehicle.vehicleNumber,
          driver:
            info && info.trip && info.trip.driver && info.trip.driver.name,
        }
        $scope.latestInfo = {
          vehicleId:
            info && info.trip && info.trip.vehicle && info.trip.vehicle.id,
          driverId:
            info && info.trip && info.trip.driver && info.trip.driver.id,
        }
      })

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
        MapService.emit("ping-trip", [trip])
      }
    }

    ticketPromise
      .then(ticket => ticket.boardStop.trip.id)
      .then(updateLatestInfo)

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

    const updateIfVehicleOrDriverChanged = ping => {
      if (
        $scope.latestInfo.vehicleId !== ping.vehicleId ||
        $scope.latestInfo.driverId !== ping.driverId
      ) {
        updateLatestInfo(ping.tripId)
      }
    }

    const updateStatus = status => {
      $scope.disp.tripStatus = status.status
    }

    $scope.$on("$ionicView.afterEnter", () => {
      sentTripToMapView()
      MapService.emit("startPingLoop")
      MapService.on("ping", updateIfVehicleOrDriverChanged)
      MapService.on("status", updateStatus)
    })

    $scope.$on("$ionicView.beforeLeave", () => {
      MapService.emit("killPingLoop")
      MapService.removeListener("ping", updateIfVehicleOrDriverChanged)
      MapService.removeListener("status", updateStatus)
    })
  },
]
