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
      boardStops: [],
      alightStops: [],
      routePath: [],
      boardStop: null,
      alightStop: null,
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
      var [boardStops, alightStops] = _.partition(trip.tripStops, (ts) => {
        return ts.canBoard
      })
      SharedVariableService.setStops(trip.tripStops.map((ts) => ts.stop));
      SharedVariableService.setBoardStops(boardStops.map((bs) => bs.stop));
      SharedVariableService.setAlightStops(alightStops.map((as) => as.stop));
      $scope.mapObject = {
        stops: trip.tripStops.map((ts) => ts.stop),
        boardStops: boardStops.map((bs) => bs.stop),
        alightStops: alightStops.map((as) => as.stop),
        boardStop: $scope.ticket.boardStop,
        alightStop: $scope.ticket.alightStop
      }
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
    })


  }
];
