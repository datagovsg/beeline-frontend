import _ from 'lodash';

export default [
  '$scope',
  '$rootScope',
  '$stateParams',
  'TicketService',
  'CompanyService',
  'TripService',
  'UserService',
  'RoutesService',
  'SharedVariableService',
  function(
    $scope,
    $rootScope,
    $stateParams,
    TicketService,
    CompanyService,
    TripService,
    UserService,
    RoutesService,
    SharedVariableService
  ) {

    $scope.mapObject = {
      stops: [],
      routePath: [],
      alightStop: null,
      boardStop: null,
      pingTrips: [],
      allRecentPings: [],
    }

    // Initialize the necessary basic data data
    $scope.user = UserService.getUser();

    $scope.showTerms = (companyId) => {
      CompanyService.showTerms(companyId);
    };

    var ticketPromise = TicketService.getTicketById(+$stateParams.ticketId);
    var tripPromise = ticketPromise.then((ticket) => {
      return TripService.getTripData(+ticket.alightStop.tripId);
    });
    var routePromise = tripPromise.then((trip) => {
      return RoutesService.getRoute(+trip.routeId);
    });
    var companyPromise = routePromise.then((route) => {
      return CompanyService.getCompany(+route.transportCompanyId);
    });
    ticketPromise.then((ticket) => {
      $scope.ticket = ticket;
      SharedVariableService.setBoardStop(ticket.boardStop)
      SharedVariableService.setAlightStop(ticket.alightStop)
    });
    tripPromise.then((trip) => {
      $scope.trip = trip;
      let stops = trip.tripStops.map((ts) => {
        return _.assign(ts.stop, {canBoard: ts.canBoard})
      })
      $scope.mapObject = {
        stops: stops,
        boardStop: $scope.ticket.boardStop,
        alightStop: $scope.ticket.alightStop,
        pingTrips: [trip]
      }
      SharedVariableService.set($scope.mapObject)
    });

    routePromise.then((route) => {
      $scope.route = route;
      if (route.path) {
        RoutesService.decodeRoutePath(route.path)
          .then((decodedPath) =>  {
            SharedVariableService.setRoutePath(decodedPath)
            $scope.mapObject.routePath = decodedPath
          })
          .catch(() => {
            SharedVariableService.setRoutePath([])
            $scope.mapObject.routePath = []
          })
      }
    });
    companyPromise.then((company) => { $scope.company = company; });

    $scope.$on('$ionicView.afterEnter', () => {
      // to plot the map
      SharedVariableService.set($scope.mapObject)
      $scope.$broadcast('startPingLoop');
    })
    
    $scope.$on('$ionicView.beforeLeave', () => {
      $scope.$broadcast('killPingLoop');
    });


  }
];
